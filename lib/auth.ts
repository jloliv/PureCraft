// Auth state subscription + helpers. Single source of truth for whether a
// user is signed in; screens read it via useAuth().
//
// Design notes:
//  - We expose loading=true on first paint so screens can avoid flashing
//    a "signed out" state while supabase-js rehydrates a stored session.
//  - `signIn`, `signUp`, `signOut` return `{ error: string | null }` so call
//    sites stay synchronous-feeling and easy to compose with form state.
//  - Errors are routed through `mapAuthError` so the UI shows human copy
//    instead of Supabase's raw English. Anything we don't recognise falls
//    through unchanged so we never hide signal.

import * as Linking from 'expo-linking';
import { useSyncExternalStore } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { events, identify, resetAnalytics } from './analytics';
import { supabase, supabaseConfigured } from './supabase';
import { flushGuestSaves } from './guest-saves';
import { flushOnboardingAnswers } from './onboarding-answers';
import { setSentryUser } from './sentry';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

let state: AuthState = {
  session: null,
  user: null,
  loading: supabaseConfigured,
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

if (supabase) {
  // Hydrate any persisted session on boot.
  void supabase.auth.getSession().then(({ data }) => {
    state = {
      session: data.session,
      user: data.session?.user ?? null,
      loading: false,
    };
    emit();
  });

  // Subscribe to all auth changes (sign-in, sign-out, token refresh).
  supabase.auth.onAuthStateChange((event, session) => {
    state = { session, user: session?.user ?? null, loading: false };
    emit();
    if (event === 'SIGNED_IN' && session?.user) {
      // Identify in analytics + crash reporting so events are tied to users.
      identify(session.user.id, { email: session.user.email });
      setSentryUser({
        id: session.user.id,
        email: session.user.email ?? undefined,
      });
      events.signedIn();
      // Flush any locally-buffered onboarding answers into the profile row.
      void flushOnboardingAnswers();
      // Promote any trial-saved recipes into saved_recipes.
      void flushGuestSaves();
    } else if (event === 'SIGNED_OUT') {
      events.signedOut();
      resetAnalytics();
      setSentryUser(null);
    }
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function snapshot(): AuthState {
  return state;
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

// Translate Supabase's generic English error strings into user-facing copy.
// We match on substrings because Supabase sometimes prepends "AuthApiError:"
// or appends codes. Anything unmatched falls through so we never silently
// hide a real failure.
export function mapAuthError(message: string | null | undefined): string | null {
  if (!message) return null;
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid_credentials')) {
    return 'Email or password is incorrect.';
  }
  if (m.includes('user already registered') || m.includes('already registered')) {
    return 'An account already exists for this email — try signing in.';
  }
  if (m.includes('email not confirmed') || m.includes('confirm your email')) {
    return 'Confirm your email first — check your inbox for the link.';
  }
  if (m.includes('password should be at least') || m.includes('password is too short')) {
    return 'Password must be at least 6 characters.';
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (m.includes('network') || m.includes('failed to fetch') || m.includes('load failed')) {
    return "Couldn't reach the server — check your connection.";
  }
  if (m.includes('invalid email')) {
    return 'That email address looks invalid.';
  }
  if (m.includes('user not found')) {
    return 'No account found for that email.';
  }
  return message;
}

// Result type for signUp — needsEmailConfirmation lets the UI switch into
// a "check your inbox" state instead of routing to /home (which would just
// kick the user back out, since no session was issued yet).
export type SignUpResult = {
  error: string | null;
  needsEmailConfirmation: boolean;
};

export async function signUp(
  email: string,
  password: string,
): Promise<SignUpResult> {
  if (!supabase) {
    return { error: 'Auth not configured', needsEmailConfirmation: false };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // After the user clicks the verification link in their email, bring
      // them back into the app. Supabase's redirect allowlist must include
      // this URL — see SUPABASE_SETUP.md.
      emailRedirectTo: Linking.createURL('/auth/verify'),
    },
  });
  if (error) {
    return { error: mapAuthError(error.message), needsEmailConfirmation: false };
  }
  events.signedUp();
  return {
    error: null,
    // Supabase returns a user without a session when "Confirm email" is on
    // in the dashboard. The user exists in auth.users but can't sign in
    // until they click the link.
    needsEmailConfirmation: !data.session && !!data.user,
  };
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: mapAuthError(error?.message) };
}

export async function signOut(): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { error } = await supabase.auth.signOut();
  return { error: mapAuthError(error?.message) };
}

// Re-send the signup confirmation email if the user lost it. Supabase
// rate-limits this server-side so we don't have to.
export async function resendVerification(
  email: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: {
      emailRedirectTo: Linking.createURL('/auth/verify'),
    },
  });
  return { error: mapAuthError(error?.message) };
}

// Send a password reset email. Supabase emails the user a magic link;
// they click it and land on the redirectTo URL, which establishes a
// recovery session that lets `updatePassword` work.
//
// The redirectTo URL is generated from the app's scheme (set in app.json
// under `expo.scheme` — currently `purecraftapp`). For this to work,
// `purecraftapp://auth/reset-password` MUST be added to the Supabase
// dashboard's Auth → URL Configuration → Redirect URLs allowlist.
export async function sendPasswordReset(
  email: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: Linking.createURL('/auth/reset-password'),
  });
  return { error: mapAuthError(error?.message) };
}

// Apply a new password (caller is in the recovery session that the magic
// link established).
export async function updatePassword(
  newPassword: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: mapAuthError(error?.message) };
}

// --- OAuth stubs ---
//
// Apple + Google sign-in require native modules (`expo-apple-authentication`,
// `expo-auth-session` or `@react-native-google-signin/google-signin`) and
// Supabase OAuth provider config in the dashboard, plus a dev-client / EAS
// rebuild before they actually authenticate. Until that prep is done these
// stubs return an error so the UI can fall back to the email path. Once
// configured, swap each body for the real call:
//   supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken })
//   supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
// and the call sites need no change.

export async function signInWithApple(): Promise<{ error: string | null }> {
  return { error: 'apple-not-configured' };
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  return { error: 'google-not-configured' };
}

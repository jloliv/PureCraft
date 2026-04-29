// Auth state subscription + helpers. Single source of truth for whether a
// user is signed in; screens read it via useAuth().
//
// Design notes:
//  - We expose loading=true on first paint so screens can avoid flashing
//    a "signed out" state while supabase-js rehydrates a stored session.
//  - `signIn`, `signUp`, `signOut` return `{ error: string | null }` so call
//    sites stay synchronous-feeling and easy to compose with form state.

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

export async function signUp(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { error } = await supabase.auth.signUp({ email, password });
  if (!error) events.signedUp();
  return { error: error?.message ?? null };
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}

// Send a password reset email. Supabase emails the user a magic link;
// they click it and land on the redirectTo URL (configured in dashboard
// → Authentication → URL Configuration). For native apps, set the redirect
// to your custom scheme (e.g. purecraft://auth/reset-password).
export async function sendPasswordReset(
  email: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  return { error: error?.message ?? null };
}

// Apply a new password (caller is in the recovery session that the magic
// link established).
export async function updatePassword(
  newPassword: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}

// --- OAuth stubs ---
//
// Apple + Google sign-in require native modules (`expo-apple-authentication`,
// `expo-auth-session`) and Supabase OAuth provider config in the dashboard,
// plus a dev-client / EAS rebuild before they actually authenticate. Until
// that prep is done, these stubs return an error so the UI can fall back to
// the email path. Once configured, swap each body for the real call:
//   supabase.auth.signInWithOAuth({ provider: 'apple' | 'google' })
// and the call sites need no change.

export async function signInWithApple(): Promise<{ error: string | null }> {
  return { error: 'apple-not-configured' };
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  return { error: 'google-not-configured' };
}

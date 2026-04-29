// User profile state — onboarding answers + per-user prefs.
//
// Architecture: parallel to lib/auth.ts. A single in-memory store hydrates
// from `user_profiles` after sign-in, then re-emits on every patch. Screens
// subscribe via useProfile() and patch via setProfile(...).
//
// Why useSyncExternalStore: same reason as auth — we want one source of
// truth and zero prop-drilling, without pulling in Zustand/Redux for a tiny
// state shape.

import { useSyncExternalStore } from 'react';

import { supabase, supabaseConfigured } from './supabase';
import type { Database } from './db-types';

export type Profile = {
  user_id: string;
  intent_categories: string[];
  household: string[];
  avoidances: string[];
  scent_preferences: string[];
  priorities: string[];
  skin_profile: Record<string, unknown>;
  routine: Record<string, unknown>;
  region: string | null;
  onboarding_step: number;
  onboarding_complete: boolean;
  display_name: string | null;
};

type ProfileState = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
};

let state: ProfileState = {
  profile: null,
  loading: supabaseConfigured,
  error: null,
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function rowToProfile(
  row: Database['public']['Tables']['user_profiles']['Row'],
): Profile {
  return {
    user_id: row.user_id,
    intent_categories: (row.intent_categories as string[]) ?? [],
    household: (row.household as string[]) ?? [],
    avoidances: (row.avoidances as string[]) ?? [],
    scent_preferences: (row.scent_preferences as string[]) ?? [],
    priorities: (row.priorities as string[]) ?? [],
    skin_profile: (row.skin_profile as Record<string, unknown>) ?? {},
    routine: (row.routine as Record<string, unknown>) ?? {},
    region: row.region,
    onboarding_step: row.onboarding_step,
    onboarding_complete: row.onboarding_complete,
    display_name: row.display_name,
  };
}

async function hydrateForUser(userId: string): Promise<void> {
  if (!supabase) return;
  state = { ...state, loading: true, error: null };
  emit();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    state = { ...state, loading: false, error: error.message };
    emit();
    return;
  }
  state = {
    profile: data ? rowToProfile(data) : { ...emptyProfile(userId) },
    loading: false,
    error: null,
  };
  emit();
}

function emptyProfile(userId: string): Profile {
  return {
    user_id: userId,
    intent_categories: [],
    household: [],
    avoidances: [],
    scent_preferences: [],
    priorities: [],
    skin_profile: {},
    routine: {},
    region: null,
    onboarding_step: 0,
    onboarding_complete: false,
    display_name: null,
  };
}

// Wire to auth: hydrate on sign-in, clear on sign-out.
if (supabase) {
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) void hydrateForUser(data.session.user.id);
    else {
      state = { profile: null, loading: false, error: null };
      emit();
    }
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) void hydrateForUser(session.user.id);
    else {
      state = { profile: null, loading: false, error: null };
      emit();
    }
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function snapshot(): ProfileState {
  return state;
}

export function useProfile(): ProfileState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

// Patch profile fields. Upserts the row if it doesn't exist yet so
// onboarding screens don't have to think about insert vs update.
export async function patchProfile(
  patch: Partial<Omit<Profile, 'user_id'>>,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Auth not configured' };
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return { error: 'Not signed in' };

  // Optimistic update so UI feels instant
  if (state.profile && state.profile.user_id === userId) {
    state = { ...state, profile: { ...state.profile, ...patch } };
    emit();
  }

  // Supabase types JSONB columns as `Json`; our profile shape narrows them
  // to specific arrays/records. The cast bypasses that since the wire
  // format is the same — these are just app-level invariants we enforce
  // on read in profile.ts.
  const row = { user_id: userId, ...patch } as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('user_profiles')
    .upsert(row as never, { onConflict: 'user_id' });

  if (error) {
    // Re-hydrate to revert on failure
    await hydrateForUser(userId);
    return { error: error.message };
  }
  return { error: null };
}

// Convenience: mark onboarding done and bump step counter.
export async function completeOnboarding(): Promise<{ error: string | null }> {
  return patchProfile({ onboarding_complete: true, onboarding_step: 8 });
}

// Force a re-fetch (e.g. after returning from a screen that may have
// changed the profile out-of-band).
export async function refreshProfile(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) await hydrateForUser(data.session.user.id);
}

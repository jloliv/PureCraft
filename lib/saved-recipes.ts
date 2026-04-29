// Saved recipes (bookmarks). Persisted in `saved_recipes` table.
//
// Same useSyncExternalStore pattern as auth/profile so screens get instant
// optimistic updates and stay consistent across the app.

import { useSyncExternalStore } from 'react';

import { events } from './analytics';
import { checkSaveGate, recordSave, recordUnsave } from './freemium';
import {
  guestSaveCount,
  isGuestSaved,
  toggleGuestSave,
  useGuestSaves,
} from './guest-saves';
import { supabase, supabaseConfigured } from './supabase';

export type SavedRecipe = {
  recipe_id: string;
  saved_at: string;
  note: string | null;
  made_count: number;
  last_made: string | null;
};

type SavedState = {
  saved: Map<string, SavedRecipe>;
  loading: boolean;
  error: string | null;
};

let state: SavedState = {
  saved: new Map(),
  loading: supabaseConfigured,
  error: null,
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function hydrateForUser(userId: string): Promise<void> {
  if (!supabase) return;
  state = { ...state, loading: true, error: null };
  emit();
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('recipe_id, saved_at, note, made_count, last_made')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  if (error) {
    state = { ...state, loading: false, error: error.message };
    emit();
    return;
  }
  const m = new Map<string, SavedRecipe>();
  for (const row of data ?? []) {
    m.set(row.recipe_id, row as SavedRecipe);
  }
  state = { saved: m, loading: false, error: null };
  emit();
}

if (supabase) {
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) void hydrateForUser(data.session.user.id);
    else {
      state = { saved: new Map(), loading: false, error: null };
      emit();
    }
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) void hydrateForUser(session.user.id);
    else {
      state = { saved: new Map(), loading: false, error: null };
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
function snapshot(): SavedState {
  return state;
}

export function useSavedRecipes(): SavedState {
  // Subscribe to both stores so guest saves also re-render heart icons.
  const supaState = useSyncExternalStore(subscribe, snapshot, snapshot);
  const { ids: guestIds } = useGuestSaves();
  if (guestIds.size === 0) return supaState;
  const merged = new Map(supaState.saved);
  for (const id of guestIds) {
    if (!merged.has(id)) {
      merged.set(id, {
        recipe_id: id,
        saved_at: new Date().toISOString(),
        note: null,
        made_count: 0,
        last_made: null,
      });
    }
  }
  return { ...supaState, saved: merged };
}

export function isRecipeSaved(recipeId: string): boolean {
  return state.saved.has(recipeId) || isGuestSaved(recipeId);
}

export async function saveRecipe(
  recipeId: string,
  note?: string,
): Promise<{ error: string | null; gated?: boolean }> {
  if (!supabase) return { error: 'Not configured' };
  const { data: s } = await supabase.auth.getSession();
  const userId = s.session?.user?.id;
  if (!userId) return { error: 'Not signed in' };

  // Freemium gate — free users get LIMITS.savedRecipes (5) saves total.
  // Caller can read `gated: true` to know whether to show the paywall.
  const gate = checkSaveGate();
  if (!gate.allow) {
    return { error: 'save-limit', gated: true };
  }

  // Optimistic
  const optimistic: SavedRecipe = {
    recipe_id: recipeId,
    saved_at: new Date().toISOString(),
    note: note ?? null,
    made_count: 0,
    last_made: null,
  };
  state = { ...state, saved: new Map(state.saved).set(recipeId, optimistic) };
  emit();

  const { error } = await supabase
    .from('saved_recipes')
    .upsert(
      { user_id: userId, recipe_id: recipeId, note: note ?? null },
      { onConflict: 'user_id,recipe_id' },
    );
  if (error) {
    await hydrateForUser(userId);
    return { error: error.message };
  }
  events.recipeSaved(recipeId);
  void recordSave();
  return { error: null };
}

export async function unsaveRecipe(
  recipeId: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Not configured' };
  const { data: s } = await supabase.auth.getSession();
  const userId = s.session?.user?.id;
  if (!userId) return { error: 'Not signed in' };

  // Optimistic
  const next = new Map(state.saved);
  next.delete(recipeId);
  state = { ...state, saved: next };
  emit();

  const { error } = await supabase
    .from('saved_recipes')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId);
  if (error) {
    await hydrateForUser(userId);
    return { error: error.message };
  }
  events.recipeUnsaved(recipeId);
  void recordUnsave();
  return { error: null };
}

export async function toggleSaved(
  recipeId: string,
): Promise<{
  saved: boolean;
  error: string | null;
  gated?: boolean;
  needsAuth?: boolean;
}> {
  // Guest path — no Supabase user. Buffer up to GUEST_SAVE_LIMIT then prompt
  // for an account. flushGuestSaves() promotes the buffer on sign-in.
  if (!supabase) return { saved: false, error: 'Not configured' };
  const { data: s } = await supabase.auth.getSession();
  if (!s.session?.user) {
    const result = toggleGuestSave(recipeId);
    if (result.needsAuth) {
      return { saved: false, error: null, needsAuth: true };
    }
    return { saved: result.saved, error: null };
  }

  if (state.saved.has(recipeId)) {
    const { error } = await unsaveRecipe(recipeId);
    return { saved: false, error };
  }
  const { error, gated } = await saveRecipe(recipeId);
  return { saved: !gated && !error, error, gated };
}

export function getGuestSaveCount(): number {
  return guestSaveCount();
}

export async function markMade(
  recipeId: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Not configured' };
  const { data: s } = await supabase.auth.getSession();
  const userId = s.session?.user?.id;
  if (!userId) return { error: 'Not signed in' };

  const existing = state.saved.get(recipeId);
  const nextCount = (existing?.made_count ?? 0) + 1;
  const now = new Date().toISOString();

  // Optimistic
  state = {
    ...state,
    saved: new Map(state.saved).set(recipeId, {
      recipe_id: recipeId,
      saved_at: existing?.saved_at ?? now,
      note: existing?.note ?? null,
      made_count: nextCount,
      last_made: now,
    }),
  };
  emit();

  const { error } = await supabase
    .from('saved_recipes')
    .upsert(
      {
        user_id: userId,
        recipe_id: recipeId,
        made_count: nextCount,
        last_made: now,
      },
      { onConflict: 'user_id,recipe_id' },
    );
  if (error) {
    await hydrateForUser(userId);
    return { error: error.message };
  }
  events.recipeMade(recipeId);
  return { error: null };
}

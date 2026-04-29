// Guest save buffer.
//
// Lets unsigned-in users tentatively save up to GUEST_SAVE_LIMIT recipes
// in local storage. The first save attempts feel "free"; on the next attempt
// the UI shows an account prompt — converting the highest-intent moment.
//
// On sign-in, flushGuestSaves() promotes the buffered IDs into the user's
// `saved_recipes` table so nothing is lost.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { supabase } from './supabase';

const KEY = 'purecraft_guest_saves_v1';

export const GUEST_SAVE_LIMIT = 2;

type GuestState = {
  ids: Set<string>;
  hydrated: boolean;
};

let state: GuestState = {
  ids: new Set(),
  hydrated: false,
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(KEY, value);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await AsyncStorage.setItem(KEY, value);
  } catch {
    // ignore
  }
}

async function clearRaw(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(KEY);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

async function persist(): Promise<void> {
  await writeRaw(JSON.stringify(Array.from(state.ids)));
}

// Hydrate on module load so heart icons reflect prior guest saves on relaunch.
void (async () => {
  const raw = await readRaw();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state = { ids: new Set(parsed.filter((x) => typeof x === 'string')), hydrated: true };
      } else {
        state = { ids: new Set(), hydrated: true };
      }
    } catch {
      state = { ids: new Set(), hydrated: true };
    }
  } else {
    state = { ids: new Set(), hydrated: true };
  }
  emit();
})();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function snapshot(): GuestState {
  return state;
}

export function useGuestSaves(): GuestState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function isGuestSaved(recipeId: string): boolean {
  return state.ids.has(recipeId);
}

export function guestSaveCount(): number {
  return state.ids.size;
}

export type GuestToggleResult =
  | { saved: boolean; needsAuth: false }
  | { saved: false; needsAuth: true };

// Toggle a guest save. Returns `needsAuth: true` when the guest tries to add
// past the limit — caller should open the auth prompt modal.
export function toggleGuestSave(recipeId: string): GuestToggleResult {
  if (state.ids.has(recipeId)) {
    const next = new Set(state.ids);
    next.delete(recipeId);
    state = { ...state, ids: next };
    emit();
    void persist();
    return { saved: false, needsAuth: false };
  }
  if (state.ids.size >= GUEST_SAVE_LIMIT) {
    return { saved: false, needsAuth: true };
  }
  const next = new Set(state.ids);
  next.add(recipeId);
  state = { ...state, ids: next };
  emit();
  void persist();
  return { saved: true, needsAuth: false };
}

// Called from auth.ts after a successful sign-in/sign-up. Promotes the local
// guest save buffer into `saved_recipes` then clears the buffer so we don't
// double-flush on a subsequent sign-out + sign-in cycle.
export async function flushGuestSaves(): Promise<void> {
  if (!supabase) return;
  if (state.ids.size === 0) return;

  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return;

  const rows = Array.from(state.ids).map((recipe_id) => ({
    user_id: userId,
    recipe_id,
  }));
  const { error } = await supabase
    .from('saved_recipes')
    .upsert(rows, { onConflict: 'user_id,recipe_id' });
  if (error) return; // leave buffer intact so a future retry can succeed

  state = { ids: new Set(), hydrated: true };
  emit();
  await clearRaw();
}

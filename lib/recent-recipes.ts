// Recent Recipes — keeps the last 10 recipe IDs the user has opened.
//
// Persisted in AsyncStorage / localStorage so it survives app restarts.
// Display surfaces: Saved screen "Recently viewed" section, optional Home
// shortcut. Recording happens automatically inside `events.recipeViewed`'s
// call site (app/result.tsx) — screens just consume the list.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

const STORAGE_KEY = 'purecraft_recent_recipes_v1';
const MAX_RECENT = 10;

let state: string[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

void (async () => {
  const raw = await readRaw();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state = parsed.filter((s) => typeof s === 'string').slice(0, MAX_RECENT);
      }
    } catch {
      state = [];
    }
  }
  hydrated = true;
  emit();
})();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function snapshot(): string[] {
  return state;
}

/** Push a recipe to the front of the recent list. De-dupes (so visiting the
 *  same recipe twice doesn't bump everything else off). */
export async function recordRecipeView(id: string): Promise<void> {
  if (!id) return;
  const next = [id, ...state.filter((x) => x !== id)].slice(0, MAX_RECENT);
  state = next;
  emit();
  await writeRaw(JSON.stringify(state));
}

/** React hook returning the live recent-id array. */
export function useRecentRecipes(): string[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function isRecentHydrated(): boolean {
  return hydrated;
}

export async function clearRecentRecipes(): Promise<void> {
  state = [];
  emit();
  await writeRaw(JSON.stringify(state));
}

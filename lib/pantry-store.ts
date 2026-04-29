// Pantry store — shared, persistent set of pantry item keys.
//
// Up to now the pantry screen kept this state local, so opening a recipe
// from anywhere else couldn't show "you have X/Y ingredients." This module
// promotes the set to a global store backed by AsyncStorage so:
//   1. Recipe detail can show a real pantry-match indicator.
//   2. Pantry Magic + Make Right Now use the same state as the pantry
//      manager (no drift).
//   3. Saves persist across launches.
//
// Default-on items match the previous "defaultIn: true" set so a fresh
// install still has the basics checked.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

const STORAGE_KEY = 'purecraft_pantry_v1';

const DEFAULT_KEYS = [
  'baking-soda',
  'white-vinegar',
  'lemon',
  'coconut-oil',
  'olive-oil',
  'sugar',
  'spray-bottles',
];

let state: Set<string> = new Set(DEFAULT_KEYS);
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
        state = new Set(parsed.filter((s) => typeof s === 'string'));
      }
    } catch {
      // keep defaults
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
function snapshot(): Set<string> {
  return state;
}

export function usePantry(): Set<string> {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function getPantry(): Set<string> {
  return state;
}

export async function addToPantry(key: string): Promise<void> {
  if (state.has(key)) return;
  state = new Set([...state, key]);
  emit();
  await writeRaw(JSON.stringify([...state]));
}

export async function removeFromPantry(key: string): Promise<void> {
  if (!state.has(key)) return;
  const next = new Set(state);
  next.delete(key);
  state = next;
  emit();
  await writeRaw(JSON.stringify([...state]));
}

export async function togglePantryItem(key: string): Promise<void> {
  if (state.has(key)) await removeFromPantry(key);
  else await addToPantry(key);
}

export async function setPantry(keys: string[]): Promise<void> {
  state = new Set(keys);
  emit();
  await writeRaw(JSON.stringify(keys));
}

export function isPantryHydrated(): boolean {
  return hydrated;
}

// Collections — client-side organizational layer for saved recipes.
//
// Sits ON TOP of lib/saved-recipes.ts (which is Supabase-backed with
// freemium gates and remains the source of truth for "is this recipe
// saved at all?"). A collection is just a named bucket of recipe IDs
// the user has chosen to group together — Favorites, Cleaning Mix,
// Holiday Picks, whatever they create.
//
// Persistence: AsyncStorage on native, localStorage on web. Same
// pattern as lib/pantry-store.ts so the API feels consistent.
//
// NOTE: this layer does NOT sync across devices today. A Supabase
// schema (`collections` + `recipe_collections` join) would replace
// this store with a server-backed version when we ship multi-device
// collection sync.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

const STORAGE_KEY = 'purecraft_collections_v1';

export type Collection = {
  id: string;
  name: string;
  recipeIds: string[];
  /** ISO timestamp of when the collection was created. */
  createdAt: string;
  /** True for the auto-created Favorites collection. Marked so the UI
   *  can hide the "Delete" affordance for it (we don't want users
   *  accidentally nuking their default bucket). */
  isDefault?: boolean;
};

export const FAVORITES_ID = 'favorites';

const DEFAULT_FAVORITES: Collection = {
  id: FAVORITES_ID,
  name: 'Favorites',
  recipeIds: [],
  createdAt: new Date(0).toISOString(),
  isDefault: true,
};

let state: Collection[] = [DEFAULT_FAVORITES];
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

async function persist(): Promise<void> {
  await writeRaw(JSON.stringify(state));
}

void (async () => {
  const raw = await readRaw();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Validate shape; drop entries that don't look like collections.
        const cleaned = parsed.filter(
          (c) =>
            c &&
            typeof c.id === 'string' &&
            typeof c.name === 'string' &&
            Array.isArray(c.recipeIds),
        );
        // Ensure Favorites exists. If it was missing (e.g. user wiped it
        // somehow), recreate so the UX always has a fallback bucket.
        const hasFavorites = cleaned.some((c) => c.id === FAVORITES_ID);
        state = hasFavorites ? cleaned : [DEFAULT_FAVORITES, ...cleaned];
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
function snapshot(): Collection[] {
  return state;
}

export function useCollections(): Collection[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function getCollections(): Collection[] {
  return state;
}

export function isCollectionsHydrated(): boolean {
  return hydrated;
}

/** Returns the IDs of every collection that contains the given recipe. */
export function getCollectionsForRecipe(recipeId: string): string[] {
  return state
    .filter((c) => c.recipeIds.includes(recipeId))
    .map((c) => c.id);
}

/** Convenience: true if a recipe lives in at least one collection. */
export function isRecipeInAnyCollection(recipeId: string): boolean {
  return state.some((c) => c.recipeIds.includes(recipeId));
}

/** Add a recipe to a collection. No-op if already present. */
export async function addRecipeToCollection(
  collectionId: string,
  recipeId: string,
): Promise<void> {
  const idx = state.findIndex((c) => c.id === collectionId);
  if (idx === -1) return;
  if (state[idx].recipeIds.includes(recipeId)) return;
  const next = [...state];
  next[idx] = {
    ...next[idx],
    recipeIds: [...next[idx].recipeIds, recipeId],
  };
  state = next;
  emit();
  await persist();
}

/** Remove a recipe from a collection. No-op if not present. */
export async function removeRecipeFromCollection(
  collectionId: string,
  recipeId: string,
): Promise<void> {
  const idx = state.findIndex((c) => c.id === collectionId);
  if (idx === -1) return;
  if (!state[idx].recipeIds.includes(recipeId)) return;
  const next = [...state];
  next[idx] = {
    ...next[idx],
    recipeIds: next[idx].recipeIds.filter((id) => id !== recipeId),
  };
  state = next;
  emit();
  await persist();
}

/**
 * Toggle a recipe's membership in a collection. Returns the new state
 * (true = recipe is now in the collection, false = removed).
 */
export async function toggleRecipeInCollection(
  collectionId: string,
  recipeId: string,
): Promise<boolean> {
  const idx = state.findIndex((c) => c.id === collectionId);
  if (idx === -1) return false;
  const has = state[idx].recipeIds.includes(recipeId);
  if (has) {
    await removeRecipeFromCollection(collectionId, recipeId);
    return false;
  }
  await addRecipeToCollection(collectionId, recipeId);
  return true;
}

/**
 * Create a new collection. Returns the new Collection so callers can
 * immediately reference it (e.g. add a recipe to it right after).
 */
export async function createCollection(name: string): Promise<Collection> {
  const trimmed = name.trim();
  const fallback = `Collection ${state.length + 1}`;
  const finalName = trimmed.length > 0 ? trimmed : fallback;
  // Slugify + suffix-on-collision so IDs stay stable even if names repeat.
  const baseId = finalName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `collection-${Date.now()}`;
  let id = baseId;
  let n = 2;
  while (state.some((c) => c.id === id)) {
    id = `${baseId}-${n++}`;
  }
  const collection: Collection = {
    id,
    name: finalName,
    recipeIds: [],
    createdAt: new Date().toISOString(),
  };
  state = [...state, collection];
  emit();
  await persist();
  return collection;
}

/** Delete a collection. The default Favorites collection is protected. */
export async function deleteCollection(collectionId: string): Promise<void> {
  if (collectionId === FAVORITES_ID) return;
  const next = state.filter((c) => c.id !== collectionId);
  if (next.length === state.length) return;
  state = next;
  emit();
  await persist();
}

/** Rename a collection. Default Favorites is protected from renaming. */
export async function renameCollection(
  collectionId: string,
  name: string,
): Promise<void> {
  if (collectionId === FAVORITES_ID) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  const idx = state.findIndex((c) => c.id === collectionId);
  if (idx === -1) return;
  const next = [...state];
  next[idx] = { ...next[idx], name: trimmed };
  state = next;
  emit();
  await persist();
}

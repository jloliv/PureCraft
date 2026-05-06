// New-recipes detection — drives the controlled "✨ New recipes
// available" prompt on Home. Replaces the always-on FAB pulse dot.
//
// Strategy: persist the catalog size the user has already "seen" in
// AsyncStorage. On every render of useAllRecipes(), compare the
// current size to the stored baseline and surface the diff. The first
// time we ever see a count, we silently set the baseline so a brand-
// new user doesn't get prompted with "97 new recipes" on launch.
//
// markNewRecipesSeen() is called from the prompt itself — on dismiss,
// on action, and on auto-hide — so the same content never re-prompts.
// The catalog only adds entries (we don't track removals here), so
// "diff" is non-negative by construction.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { useAllRecipes } from '@/constants/recipes-remote';

const KEY = 'purecraft_last_seen_recipe_count';

async function readSeen(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    // Storage unavailable — treat as "no baseline yet" so the next
    // call establishes one.
    return null;
  }
}

async function writeSeen(n: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, String(n));
  } catch {
    // Best-effort — losing the write just means a future recompute
    // might fall back to "no baseline" behavior.
  }
}

/**
 * Returns the number of recipes added since the user last "saw" the
 * catalog, capped at 0 (we never report negative deltas).
 *
 * First-launch behavior: initializes the baseline silently and
 * returns 0, so the prompt doesn't fire on first install.
 */
export function useNewRecipesCount(): number {
  const recipes = useAllRecipes();
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const seen = await readSeen();
      if (cancelled) return;
      if (seen === null) {
        // Establish baseline and stay quiet — no prompt for first
        // sighting of the catalog. Future syncs that ADD recipes will
        // cause the diff to be positive on the next mount.
        await writeSeen(recipes.length);
        if (!cancelled) setDiff(0);
        return;
      }
      const n = Math.max(0, recipes.length - seen);
      if (!cancelled) setDiff(n);
    })();
    return () => {
      cancelled = true;
    };
  }, [recipes.length]);

  return diff;
}

/**
 * Mark the current catalog as seen. Called by the prompt component on
 * dismiss / action / auto-hide so the same set of new recipes never
 * triggers the prompt twice.
 */
export async function markNewRecipesSeen(currentCount: number): Promise<void> {
  await writeSeen(currentCount);
}

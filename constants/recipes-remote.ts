// Remote-aware recipe layer.
//
// Strategy: ship with the bundled JSON catalog (constants/recipes.ts) so the
// app paints instantly and works offline. On launch, fetch the latest catalog
// from Supabase in the background and replace the in-memory store. Screens
// that subscribe via `useAllRecipes()` re-render automatically.
//
// If Supabase isn't configured (no env vars), this module returns the bundled
// data unchanged — same behavior as the prototype.

import { useSyncExternalStore } from 'react';

import { ALL_RECIPES as BUNDLED, type Recipe } from './recipes';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { RecipeRow } from '@/lib/db-types';

let recipes: Recipe[] = BUNDLED;
const listeners = new Set<() => void>();
let didSync = false;
let inflight: Promise<void> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function rowToRecipe(r: RecipeRow): Recipe {
  return {
    id: r.id,
    // Slug-IDed recipes have null numeric_id — fall back to NaN so callers
    // doing numeric sorting can detect & deprioritize.
    numericId:
      r.numeric_id ?? (Number.isFinite(Number(r.id)) ? Number(r.id) : NaN),
    title: r.title,
    categoryKey: r.category_key,
    categoryLabel: r.category_label,
    difficulty: r.difficulty,
    time: r.time_label,
    ingredients: r.ingredients,
    instructions: r.instructions,
    safeForKids: r.safe_for_kids,
    costSavings: r.cost_savings ?? '',
    tags: r.tags,
    pantryMagic: r.pantry_magic ?? false,
  };
}

async function syncFromSupabase(): Promise<void> {
  if (!supabaseConfigured || !supabase) return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_published', true)
        .order('numeric_id', { ascending: true });
      if (error) throw error;
      if (data && data.length) {
        const remote = (data as RecipeRow[]).map(rowToRecipe);
        // Bundled entries that aren't yet in remote (e.g. a new recipe
        // landed in the JSON but the seed hasn't been applied to Supabase)
        // are preserved on top of the remote set so the app stays current
        // without waiting on a DB push.
        const remoteIds = new Set(remote.map((r) => r.id));
        const onlyBundled = BUNDLED.filter((b) => !remoteIds.has(b.id));
        recipes = [...remote, ...onlyBundled];
        emit();
      }
      didSync = true;
    } catch (err) {
      // Stay on bundled data. Silently fail — the app still works.
      // eslint-disable-next-line no-console
      console.warn('[recipes-remote] sync failed:', err);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

// Kick off a sync as soon as the module loads. Cheap, non-blocking.
if (supabaseConfigured) {
  void syncFromSupabase();
}

// =============================================================================
// Public API — mirrors constants/recipes.ts so screens can swap imports.
// =============================================================================

export function getAllRecipes(): Recipe[] {
  return recipes;
}

export function findRecipeById(id: string | number | undefined): Recipe | undefined {
  if (id == null) return undefined;
  const s = String(id);
  return recipes.find((r) => r.id === s);
}

export function getRecipesByCategory(key: string): Recipe[] {
  if (key === 'all' || !key) return recipes;
  return recipes.filter((r) => r.categoryKey === key);
}

export function searchRecipes(query: string, source: Recipe[] = recipes): Recipe[] {
  const q = query.trim().toLowerCase();
  if (!q) return source;
  return source.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.categoryLabel.toLowerCase().includes(q) ||
      r.ingredients.some((i) => i.toLowerCase().includes(q)),
  );
}

export function refreshRecipes(): Promise<void> {
  return syncFromSupabase();
}

// Server-side search via Postgres tsvector. Falls back to local search if
// Supabase isn't configured or the RPC fails. Use this for live "as-you-type"
// search — sub-50ms typical, filters in the DB instead of streaming all rows.
export async function searchRecipesRemote(
  query: string,
  limit = 30,
): Promise<Recipe[]> {
  const q = query.trim();
  if (!q) return recipes;
  if (!supabaseConfigured || !supabase) {
    return searchRecipes(q);
  }
  const { data, error } = await supabase.rpc('search_recipes', {
    q,
    max_results: limit,
  });
  if (error || !data) {
    // Network blip or RPC down — fall back to in-memory search.
    const local = searchRecipes(q);
    void import('@/lib/analytics').then((m) =>
      m.events.searchPerformed(q, local.length),
    );
    return local;
  }
  const results = (data as RecipeRow[]).map(rowToRecipe);
  // Lazy-import analytics so this module stays usable without it.
  void import('@/lib/analytics').then((m) =>
    m.events.searchPerformed(q, results.length),
  );
  return results;
}

// React subscription — components stay in sync as remote data lands.
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function snapshot() {
  return recipes;
}

export function useAllRecipes(): Recipe[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function useDidSync(): boolean {
  // Trivial: re-renders when remote data lands.
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return didSync;
}

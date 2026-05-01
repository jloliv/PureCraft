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

import { ALL_RECIPES as BUNDLED, slugifyRecipeId, type Recipe } from './recipes';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { RecipeRow } from '@/lib/db-types';

let recipes: Recipe[] = BUNDLED;
const listeners = new Set<() => void>();
let didSync = false;
let inflight: Promise<void> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

// Recipes that were removed from the bundled catalog but may still
// exist in the Supabase `recipes` table until the next migration runs.
// Filter them out at the sync boundary so the UI stops showing them
// the moment this build lands, regardless of remote DB state.
//
// When the SQL migration (db/0004_remove_deprecated_recipes.sql) is
// applied to Supabase, this set can be cleared — but keeping it as a
// belt-and-braces guard does no harm.
const DEPRECATED_NUMERIC_IDS = new Set<number>([
  62, // Faucet Shine Spray
  64, // Window Track Cleaner (original)
  91, // Quick Sink Shine
  93, // Window Track Cleaner (quick variant)
]);
const DEPRECATED_TITLES = new Set<string>([
  'Faucet Shine Spray',
  'Window Track Cleaner',
  'Quick Sink Shine',
]);

function rowToRecipe(r: RecipeRow): Recipe {
  // Match against bundled entries in PRIORITY order, not OR. The old
  // `numericId === ... || id === ... || title === ...` collapsed any
  // recipes that share a title (e.g. both "Window Track Cleaner"
  // variants) onto the SAME bundled entry, because title-match fires
  // for the first iterated bundled row regardless of numericId.
  // Resolving each match category sequentially prevents the weaker
  // criterion from shadowing the stronger one.
  const bundledMatch =
    (r.numeric_id != null
      ? BUNDLED.find((b) => b.numericId === r.numeric_id)
      : undefined) ??
    BUNDLED.find((b) => b.id === r.id) ??
    BUNDLED.find((b) => b.title === r.title);
  return {
    id: bundledMatch?.id ?? slugifyRecipeId(r.title),
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
        // Drop deprecated rows BEFORE mapping so the slug fallback in
        // rowToRecipe doesn't accidentally resurrect them under a
        // freshly-derived id.
        const filtered = (data as RecipeRow[]).filter((r) => {
          if (
            r.numeric_id != null &&
            DEPRECATED_NUMERIC_IDS.has(r.numeric_id)
          ) {
            return false;
          }
          if (r.title && DEPRECATED_TITLES.has(r.title)) {
            return false;
          }
          return true;
        });
        const mapped = filtered.map(rowToRecipe);
        // Safety net: even after the priority-chain fix, dedupe by id
        // before the UI ever sees the list. If the matcher ever
        // regresses or the DB seed gets out of sync, the worst case
        // is "we keep the first occurrence" instead of a React
        // duplicate-key warning that breaks list rendering.
        const seenIds = new Set<string>();
        const remote: Recipe[] = [];
        for (const r of mapped) {
          if (seenIds.has(r.id)) {
            // eslint-disable-next-line no-console
            if (__DEV__) {
              console.warn(
                '[recipes-remote] dropping duplicate remote recipe id:',
                r.id,
                '(title:', r.title, ', numericId:', r.numericId, ')',
              );
            }
            continue;
          }
          seenIds.add(r.id);
          remote.push(r);
        }
        // Bundled entries that aren't yet in remote (e.g. a new recipe
        // landed in the JSON but the seed hasn't been applied to Supabase)
        // are preserved on top of the remote set so the app stays current
        // without waiting on a DB push.
        const onlyBundled = BUNDLED.filter((b) => !seenIds.has(b.id));
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
  return recipes.find((r) => r.id === s || String(r.numericId) === s);
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

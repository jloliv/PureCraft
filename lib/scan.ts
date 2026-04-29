// Client-side scanner: capture → upload → match → return UI-ready result.
//
// Two-stage pipeline:
//   1. `scanLabel(base64)` — calls the `scan-label` Edge Function (Claude
//      Vision). Returns canonical brand / ingredients / type or marks the
//      image unreadable.
//   2. `matchScanToRecipe(scan, recipes)` — computes per-recipe confidence
//      against the catalog using ingredient overlap. Pure function so it's
//      easy to test and reason about.

import { track } from './analytics';
import type { Recipe } from '@/constants/recipes';
import { supabase } from './supabase';

export type LabelScan = {
  brand: string | null;
  product_name: string | null;
  product_type: 'cleaning' | 'beauty' | 'home' | 'laundry' | 'unknown';
  ingredients: string[];
  ocr_confidence: number;
  unreadable: boolean;
  reason?: string;
};

export type ScanMatch = {
  recipe: Recipe;
  confidence: number; // 0–1
  matchedIngredients: string[];
  unmatchedIngredients: string[];
};

export type ScanOutcome =
  | { kind: 'matched'; scan: LabelScan; match: ScanMatch; tier: 'high' | 'close' | 'alternative' }
  | { kind: 'unreadable'; scan: LabelScan; reason: string }
  | { kind: 'error'; error: string };

// ---------- Edge Function call --------------------------------------------

export async function scanLabel(
  imageBase64: string,
  mime: string = 'image/jpeg',
): Promise<{ scan: LabelScan | null; error: string | null }> {
  if (!supabase) return { scan: null, error: 'Backend not configured' };
  const { data, error } = await supabase.functions.invoke<{
    result?: LabelScan;
    error?: string;
  }>('scan-label', {
    body: { image_base64: imageBase64, mime },
  });
  if (error) return { scan: null, error: error.message };
  if (!data?.result) return { scan: null, error: data?.error ?? 'No result' };
  return { scan: data.result, error: null };
}

// ---------- Matching engine ------------------------------------------------

/** Normalize an ingredient string for fuzzy comparison. Lowercase + trim +
 *  drop common qualifiers ("organic", "essential oil", parens). Keeps the
 *  matcher resilient to label-vs-recipe phrasing differences. */
export function normalizeIngredient(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\(.+?\)/g, '') // drop parenthetical ("citrus aurantium (orange)")
    .replace(/\b(organic|pure|natural|cold[- ]pressed|usda|essential)\b/g, '')
    .replace(/\boil\b/g, '') // "lavender oil" / "lavender" both match
    .replace(/\s+/g, ' ')
    .trim();
}

/** Token-set match: does any normalized scan ingredient overlap with the
 *  recipe ingredient on a non-trivial keyword? Returns true on partial
 *  match so "lemon peels" matches "lemon" and vice versa. */
function ingredientOverlap(scanIng: string, recipeIng: string): boolean {
  const a = normalizeIngredient(scanIng);
  const b = normalizeIngredient(recipeIng);
  if (!a || !b) return false;
  if (a === b) return true;
  // Token overlap — drop short noise words.
  const tokens = (s: string) =>
    s.split(' ').filter((t) => t.length >= 4);
  const aT = tokens(a);
  const bT = tokens(b);
  return aT.some((t) => bT.includes(t)) || bT.some((t) => aT.includes(t));
}

export function matchScanToRecipe(
  scan: LabelScan,
  recipes: Recipe[],
): ScanMatch | null {
  if (scan.unreadable || scan.ingredients.length === 0) return null;

  let best: ScanMatch | null = null;

  for (const recipe of recipes) {
    if (recipe.ingredients.length === 0) continue;

    // Optional: bias to same product_type. We don't *exclude* mismatches
    // because Claude's product_type is heuristic, but a category match adds
    // a small confidence bump downstream.
    const matched: string[] = [];
    const unmatched: string[] = [];

    for (const recipeIng of recipe.ingredients) {
      const hit = scan.ingredients.find((s) => ingredientOverlap(s, recipeIng));
      if (hit) matched.push(recipeIng);
      else unmatched.push(recipeIng);
    }

    // Score = matched / total recipe ingredients. (Symmetric with what the
    // user expects: "this recipe uses N of the things on this label".)
    const baseScore = matched.length / recipe.ingredients.length;

    // Category bonus: cleaning label → cleaning recipe
    const categoryBonus =
      scan.product_type === 'cleaning' && recipe.categoryKey === 'cleaning'
        ? 0.1
        : scan.product_type === 'beauty' &&
            (recipe.categoryKey === 'beauty-skincare' ||
              recipe.categoryKey === 'hair-care')
          ? 0.1
          : scan.product_type === 'laundry' && recipe.categoryKey === 'laundry'
            ? 0.1
            : scan.product_type === 'home' &&
                recipe.categoryKey === 'home-air-freshening'
              ? 0.1
              : 0;

    const confidence = Math.min(1, baseScore + categoryBonus);

    if (!best || confidence > best.confidence) {
      best = {
        recipe,
        confidence,
        matchedIngredients: matched,
        unmatchedIngredients: unmatched,
      };
    }
  }

  return best;
}

/** Bucket a confidence score for UX copy. */
export function tierForConfidence(c: number): 'high' | 'close' | 'alternative' {
  if (c >= 0.8) return 'high';
  if (c >= 0.5) return 'close';
  return 'alternative';
}

// ---------- One-shot wrapper -----------------------------------------------

export async function performScan(
  imageBase64: string,
  recipes: Recipe[],
  mime: string = 'image/jpeg',
): Promise<ScanOutcome> {
  track('scan_started');
  const { scan, error } = await scanLabel(imageBase64, mime);
  if (error || !scan) {
    track('scan_failed', { error: error ?? 'no result' });
    return { kind: 'error', error: error ?? 'No result' };
  }
  if (scan.unreadable) {
    track('scan_unreadable', { reason: scan.reason ?? 'unknown' });
    return {
      kind: 'unreadable',
      scan,
      reason: scan.reason ?? "Couldn't read ingredients clearly",
    };
  }
  const match = matchScanToRecipe(scan, recipes);
  if (!match) {
    track('scan_no_match');
    return {
      kind: 'unreadable',
      scan,
      reason: "Couldn't match anything in your library",
    };
  }
  const tier = tierForConfidence(match.confidence);
  track('scan_matched', {
    recipe_id: match.recipe.id,
    confidence: match.confidence,
    tier,
  });
  return { kind: 'matched', scan, match, tier };
}

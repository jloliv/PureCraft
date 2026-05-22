// Pantry Match — score a recipe against the user's pantry contents.
//
// Used by:
//   - Recipe detail (the "X of Y ingredients" indicator)
//   - Pantry Magic landing screen (sort by match desc, threshold ≥ 0.7)
//   - Home "What You Can Make Right Now" (filter to status === 'ready')
//
// The matching is fuzzy by design: recipe ingredients are full strings
// like "2 cups epsom salt", and pantry keys are canonical slugs. We reuse
// `extractIngredientName` from smart-swaps + a per-pantry-item alias list
// so "Lemon peels" hits the "lemon" pantry slot, etc.

import { INGREDIENTS } from '@/constants/ingredients';
import { extractIngredientName } from '@/constants/smart-swaps';

export type MatchStatus = 'ready' | 'almost' | 'partial';

export type PantryMatch = {
  /** Recipe ingredient strings the user already has. */
  matched: string[];
  /** Recipe ingredient strings the user needs to acquire. */
  missing: string[];
  /** Total ingredient count in the recipe. */
  total: number;
  /** Match ratio: matched / total. 0 if total is 0. */
  percent: number;
  /** Bucketed status for UI copy / sorting. */
  status: MatchStatus;
};

/** Pantry id → free-text aliases, derived from the canonical INGREDIENTS
 *  catalog so adding an ingredient (e.g. shea butter) automatically makes
 *  recipe → pantry matching work for it. Previously this was a hand-curated
 *  subset, which is why ingredients added to the catalog later (shea butter,
 *  hydrogen peroxide, peppermint oil, etc.) were silently invisible to the
 *  matcher. */
const PANTRY_ALIASES: Record<string, string[]> = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i.aliases]),
);

/** Map a recipe ingredient string to the matching pantry key, or null. */
export function pantryKeyForIngredient(ingredientText: string): string | null {
  const norm = extractIngredientName(ingredientText);
  if (!norm) return null;
  for (const [key, aliases] of Object.entries(PANTRY_ALIASES)) {
    for (const alias of aliases) {
      if (norm === alias || norm.includes(alias)) return key;
    }
  }
  return null;
}

/** Score a recipe against the user's pantry. Pure function — safe to call
 *  from a memo, list selector, or ranking function. */
export function computeMatch(
  recipeIngredients: string[],
  pantry: Set<string>,
): PantryMatch {
  const matched: string[] = [];
  const missing: string[] = [];
  for (const ing of recipeIngredients) {
    const key = pantryKeyForIngredient(ing);
    if (key && pantry.has(key)) matched.push(ing);
    else missing.push(ing);
  }
  const total = recipeIngredients.length;
  const percent = total === 0 ? 0 : matched.length / total;
  const status: MatchStatus =
    percent >= 1 ? 'ready' : percent >= 0.7 ? 'almost' : 'partial';
  return { matched, missing, total, percent, status };
}

/** UI copy variants per status. Kept here so screens render consistent labels. */
export const MATCH_COPY: Record<MatchStatus, { label: string; sub: string }> = {
  ready: { label: 'Ready to Make', sub: 'You have everything you need' },
  almost: { label: 'Almost ready', sub: 'Just a couple of items to grab' },
  partial: { label: 'Partial match', sub: 'Several items needed to make this' },
};

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

/** Default aliases per pantry item — matches the canonical PANTRY list in
 *  app/pantry.tsx. Kept here as a separate copy so `pantry-match.ts` has no
 *  circular dependency on the pantry screen. Update both when adding items. */
const PANTRY_ALIASES: Record<string, string[]> = {
  'baking-soda': ['baking soda'],
  'white-vinegar': ['white vinegar', 'vinegar'],
  lemon: ['lemon', 'lemon peels', 'lemon juice'],
  'coconut-oil': ['coconut oil'],
  'olive-oil': ['olive oil'],
  sugar: ['sugar', 'cane sugar', 'brown sugar'],
  'castile-soap': ['castile soap'],
  'witch-hazel': ['witch hazel'],
  'distilled-water': ['distilled water', 'water'],
  'sea-salt': ['sea salt', 'salt'],
  cornstarch: ['cornstarch'],
  honey: ['honey'],
  'rubbing-alcohol': ['rubbing alcohol', 'isopropyl alcohol'],
  'lavender-oil': ['lavender oil', 'lavender essential oil'],
  'tea-tree-oil': ['tea tree oil'],
  'eucalyptus-oil': ['eucalyptus oil'],
  'rosemary-oil': ['rosemary oil'],
  'lemon-eo': ['lemon essential oil', 'lemon eo'],
  'spray-bottles': ['spray bottle'],
  'glass-jars': ['glass jar', 'jar'],
  funnel: ['funnel'],
};

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

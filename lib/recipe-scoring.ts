// Recipe attribute scoring — derives 1-5 scores plus an allergen
// list for every catalog recipe from its existing fields. The output
// is what lib/recipe-ranking.ts uses as input for the weighted
// ranking that powers personalized "what should I make" surfaces.
//
// Why derive vs. hand-tag: 97 launch recipes plus a continuously-
// updating Supabase catalog. Hand-tagging means every new recipe
// needs a content pass before it ranks correctly; deriving means
// new recipes work the day they ship. The trade-off is that the
// scores are heuristic, not ground-truth — see the comment on each
// derivation for the assumption it's making.
//
// Score axes:
//   safety        non-toxic / skin-safe / pet-safe
//   budget        cheap ingredients, common pantry items
//   effectiveness strength of cleaning / cosmetic result
//   speed         total time including waits
//   eco           reusable / refillable, low waste
//   allergens     specific ingredient strings to filter on

import type { Recipe } from '@/constants/recipes';

export type RecipeScore = {
  safety: number;
  budget: number;
  effectiveness: number;
  speed: number;
  eco: number;
  /** Lowercase ingredient substrings the user might want to filter
   *  out. Compared against the user's `profile.avoidances` for hard
   *  exclusion in the ranker. */
  allergens: string[];
};

// =============================================================================
// Allergen detection
// =============================================================================
//
// Substrings to search for in ingredient text. Each entry is treated
// as a discrete allergen. We err on the side of FLAGGING — false
// positives just mean the user with no avoidance never notices, but
// false negatives could hand a recipe with tea tree to someone who
// flagged it.

const COMMON_ALLERGENS: readonly string[] = [
  'tea tree',
  'lavender',
  'eucalyptus',
  'peppermint',
  'rosemary',
  'lemon essential oil',
  'lemon eo',
  'orange essential oil',
  'citrus oil',
  'fragrance oil',
  'fragrance',
  'perfume',
  'rubbing alcohol',
  'isopropyl alcohol',
  'hydrogen peroxide',
  'castile soap',
  'soy wax',
];

function detectAllergens(ingredients: string[]): string[] {
  const found = new Set<string>();
  const haystack = ingredients.map((i) => i.toLowerCase());
  for (const allergen of COMMON_ALLERGENS) {
    if (haystack.some((line) => line.includes(allergen))) {
      found.add(allergen);
    }
  }
  return Array.from(found);
}

// =============================================================================
// Per-axis derivations
// =============================================================================

function clamp(n: number, min = 1, max = 5): number {
  return Math.min(max, Math.max(min, n));
}

function parseMinutes(time: string): number {
  // Accepts "3 min", "20 min", "5-10 min", "Under 5 min". For ranges,
  // takes the lower bound (optimistic — matches "I can do this in X").
  const m = time.match(/\d+/);
  return m ? Number(m[0]) : 10;
}

function deriveSafety(r: Recipe): number {
  // Base 3, +2 for explicit kid-safe flag, -1 per harsh ingredient
  // detected, +1 if the recipe is purely pantry-staples.
  let score = 3;
  if (r.safeForKids) score += 2;
  const text = r.ingredients.join(' ').toLowerCase();
  if (/rubbing alcohol|isopropyl alcohol/.test(text)) score -= 1;
  if (/hydrogen peroxide/.test(text)) score -= 1;
  if (/bleach|ammonia|borax/.test(text)) score -= 2;
  // Pure-pantry recipes (only common kitchen items) read as safer.
  const isPantryOnly = r.ingredients.every((i) =>
    /water|vinegar|baking soda|salt|sugar|lemon|olive oil|coconut oil|honey|cornstarch/i.test(
      i,
    ),
  );
  if (isPantryOnly) score += 1;
  return clamp(score);
}

function deriveBudget(r: Recipe): number {
  // costSavings format examples: "$5 saved", "$11 saved". Parse the
  // number and bucket. Higher savings → cheaper to make → higher
  // budget score.
  const dollarMatch = r.costSavings.match(/(\d+(?:\.\d+)?)/);
  const saved = dollarMatch ? Number(dollarMatch[1]) : 0;
  let score = 3;
  if (saved >= 10) score = 5;
  else if (saved >= 5) score = 4;
  else if (saved >= 2) score = 3;
  else if (saved > 0) score = 2;
  // Specialty oils suggest a trip to a specialty store — penalty.
  if (r.ingredients.some((i) => /essential oil/i.test(i))) score -= 1;
  // Long ingredient lists mean more shopping.
  if (r.ingredients.length >= 6) score -= 1;
  return clamp(score);
}

function deriveEffectiveness(r: Recipe): number {
  // Difficulty correlates with strength of result. Cleaning &
  // laundry recipes get a small bump because "effectiveness" reads
  // as "how well does it clean."
  const byDifficulty =
    r.difficulty === 'Hard' ? 5 : r.difficulty === 'Medium' ? 4 : 3;
  let score = byDifficulty;
  if (r.categoryKey === 'cleaning' || r.categoryKey === 'laundry') {
    score += 1;
  }
  return clamp(score);
}

function deriveSpeed(r: Recipe): number {
  const minutes = parseMinutes(r.time);
  // Inverted scale: lower minutes → higher speed score.
  if (minutes < 5) return 5;
  if (minutes <= 10) return 4;
  if (minutes <= 15) return 3;
  if (minutes <= 20) return 2;
  return 1;
}

function deriveEco(r: Recipe): number {
  // Eco proxies: refillable bottles (cleaning/laundry/home-air bias),
  // pantry tag means common reusable ingredients, kid-safe overlaps
  // with non-toxic. Penalties for single-use chemical signals.
  let score = 3;
  if (
    r.categoryKey === 'cleaning' ||
    r.categoryKey === 'laundry' ||
    r.categoryKey === 'home-air-freshening'
  ) {
    score += 1;
  }
  if (r.tags.includes('pantry')) score += 1;
  if (r.safeForKids) score += 1;
  const text = r.ingredients.join(' ').toLowerCase();
  if (/rubbing alcohol|isopropyl alcohol|peroxide/.test(text)) score -= 1;
  if (/aerosol|disposable/.test(text)) score -= 1;
  return clamp(score);
}

// =============================================================================
// Public API
// =============================================================================

export function scoreRecipe(recipe: Recipe): RecipeScore {
  return {
    safety: deriveSafety(recipe),
    budget: deriveBudget(recipe),
    effectiveness: deriveEffectiveness(recipe),
    speed: deriveSpeed(recipe),
    eco: deriveEco(recipe),
    allergens: detectAllergens(recipe.ingredients),
  };
}

/** True if any of the recipe's allergens overlap with the user's
 *  avoidance list. Substring match in both directions so "lavender"
 *  in avoidances matches "lavender oil" allergen and vice versa. */
export function recipeHasUserAllergen(
  score: RecipeScore,
  avoidances: readonly string[],
): boolean {
  if (avoidances.length === 0) return false;
  const lowered = avoidances.map((a) => a.toLowerCase());
  return score.allergens.some((a) =>
    lowered.some((u) => a.includes(u) || u.includes(a)),
  );
}

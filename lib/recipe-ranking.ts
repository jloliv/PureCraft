// Weighted recipe ranking — turns the user's onboarding priorities
// into a ranked top-N. The scoring layer (lib/recipe-scoring.ts)
// derives 1-5 attribute scores per recipe; this module weights those
// scores by what the user said matters most, applies a hard allergy
// filter on top, and returns the best matches.
//
// Two-stage pipeline:
//   1. EXCLUDE recipes whose allergens overlap with the user's
//      `avoidances`. This is non-negotiable — never bury an allergy
//      hit, drop it.
//   2. SCORE the rest. Selected priorities get a 2× weight; safety
//      and effectiveness always get a 1× baseline so results don't
//      degenerate when the user picks weird combinations
//      (e.g. budget+fast+eco shouldn't crown a useless recipe).
//
// Caps output to the spec's "top 1-3 only" — surfacing more than
// that defeats the personalization signal.
//
// Pure function — call from a useMemo, never on render.

import type { Recipe } from '@/constants/recipes';
import {
  recipeHasUserAllergen,
  scoreRecipe,
  type RecipeScore,
} from './recipe-scoring';

// Priority keys must match the keys in app/onboarding/priorities.tsx.
// Adding a new priority means adding a new entry here AND mapping it
// to a score axis below.
export type PriorityKey =
  | 'safety'
  | 'budget'
  | 'results'
  | 'fast'
  | 'eco-friendly'
  | 'allergy-free';

// Maps a priority key to the score axis it boosts. 'allergy-free' is
// special — it doesn't boost a numeric axis, it inverts allergen
// count into a score (recipes with fewer allergens score higher when
// allergy-free is selected).
type ScoreAxis = keyof Omit<RecipeScore, 'allergens'>;
const PRIORITY_TO_AXIS: Record<Exclude<PriorityKey, 'allergy-free'>, ScoreAxis> = {
  safety: 'safety',
  budget: 'budget',
  results: 'effectiveness',
  fast: 'speed',
  'eco-friendly': 'eco',
};

// Weights applied to each axis. Selected priorities double; the two
// "always counts" baselines (effectiveness + safety) keep a 1× even
// when the user didn't pick them.
const SELECTED_WEIGHT = 2;
const BASELINE_WEIGHT = 1;
const BASELINE_AXES: ScoreAxis[] = ['effectiveness', 'safety'];

// Allergy-free bonus per zero-allergen recipe when the priority is
// selected. Calibrated to outrank a single attribute's worth of
// boost so a recipe with 0 allergens wins over one with 1 allergen
// even if the latter scores slightly higher on other axes.
const ALLERGY_FREE_BONUS = 4;

export type RankOptions = {
  /** Up to 3 priority keys from the onboarding picker. */
  priorities?: readonly PriorityKey[];
  /** Hard-exclude any recipe whose allergens overlap. Drawn from
   *  profile.avoidances by the caller. */
  avoidances?: readonly string[];
  /** Result cap. Default 3 per spec ("top 1-3 only"). */
  limit?: number;
};

export type RankedRecipe = {
  recipe: Recipe;
  score: number;
  /** The component scores so callers can show "why" chips later. */
  components: RecipeScore;
};

export function rankRecipes(
  recipes: readonly Recipe[],
  opts: RankOptions = {},
): RankedRecipe[] {
  const priorities = opts.priorities ?? [];
  const avoidances = opts.avoidances ?? [];
  const limit = opts.limit ?? 3;

  const allergyFree = priorities.includes('allergy-free');
  const selectedAxes = new Set<ScoreAxis>();
  for (const p of priorities) {
    if (p !== 'allergy-free') {
      selectedAxes.add(PRIORITY_TO_AXIS[p]);
    }
  }

  // Build the per-axis weight table. Baselines always count.
  const weights: Record<ScoreAxis, number> = {
    safety: 0,
    budget: 0,
    effectiveness: 0,
    speed: 0,
    eco: 0,
  };
  for (const axis of BASELINE_AXES) {
    weights[axis] = BASELINE_WEIGHT;
  }
  for (const axis of selectedAxes) {
    weights[axis] = SELECTED_WEIGHT;
  }

  const scored: RankedRecipe[] = [];
  for (const recipe of recipes) {
    const components = scoreRecipe(recipe);
    // Stage 1 — hard allergen filter. Never surface a recipe that
    // contains an ingredient the user explicitly avoids.
    if (recipeHasUserAllergen(components, avoidances)) continue;

    // Stage 2 — weighted score across the five numeric axes.
    let score = 0;
    score += components.safety * weights.safety;
    score += components.budget * weights.budget;
    score += components.effectiveness * weights.effectiveness;
    score += components.speed * weights.speed;
    score += components.eco * weights.eco;

    // Allergy-free bonus — only when explicitly prioritized AND the
    // recipe has no allergens. Doesn't double-apply if the user
    // already filtered via avoidances.
    if (allergyFree && components.allergens.length === 0) {
      score += ALLERGY_FREE_BONUS;
    }

    scored.push({ recipe, score, components });
  }

  // Sort descending by score. Stable: original catalog order breaks ties.
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/** Convenience: just the recipe rows, top-N. */
export function topRecipesForPriorities(
  recipes: readonly Recipe[],
  opts: RankOptions = {},
): Recipe[] {
  return rankRecipes(recipes, opts).map((r) => r.recipe);
}

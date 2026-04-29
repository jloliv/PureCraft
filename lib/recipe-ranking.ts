// Recipe ranking — boosts/penalties based on the user's onboarding profile.
//
// Soft filter only: avoidances penalize, matching priorities + intent
// boost. Recipes are never *hidden* unless the avoidance is severe (e.g.
// the recipe contains an avoidance ingredient) — they just slide down the
// list. This matches the freemium UX guideline "never block, always show
// less prominently."
//
// Pure function — call from a memo, never on render.

import type { Recipe } from '@/constants/recipes';
import { extractIngredientName } from '@/constants/smart-swaps';
import type { Profile } from './profile';

export type RankedRecipe = {
  recipe: Recipe;
  score: number;
  /** Reasons we ranked it higher — surface as chips if useful later. */
  reasons: string[];
};

const SAFE_FOR_KIDS_BOOST = 1.5;
const PRIORITY_BOOST = 0.6;
const INTENT_BOOST = 1.0;
const PANTRY_MAGIC_BOOST = 0.4;
const AVOIDANCE_PENALTY = -2.0;
const SCENT_FREE_BOOST = 0.3;

export function rankRecipes(
  recipes: Recipe[],
  profile: Profile | null,
): RankedRecipe[] {
  // No profile → no ranking, neutral order.
  if (!profile) {
    return recipes.map((recipe) => ({ recipe, score: 0, reasons: [] }));
  }

  const household = profile.household ?? [];
  const hasYoungKids =
    household.includes('baby') || household.includes('young');
  const intent = new Set(profile.intent_categories ?? []);
  const avoidances = (profile.avoidances ?? []).map((a) => a.toLowerCase());
  const scentPrefs = profile.scent_preferences ?? [];
  const wantsLowScent = scentPrefs.some((s) =>
    /low|sensitive|unscented|fragrance.?free/i.test(s),
  );
  const priorities = (profile.priorities ?? []).map((p) => p.toLowerCase());

  const ranked = recipes.map((recipe) => {
    let score = 0;
    const reasons: string[] = [];

    // --- Boosts ---------------------------------------------------------

    if (hasYoungKids && recipe.safeForKids) {
      score += SAFE_FOR_KIDS_BOOST;
      reasons.push('Family-safe');
    }

    if (intent.has(recipe.categoryKey)) {
      score += INTENT_BOOST;
      reasons.push('Matches your interests');
    }

    if (recipe.pantryMagic) {
      score += PANTRY_MAGIC_BOOST;
    }

    // Priority match — match priority text against tags + category label.
    for (const p of priorities) {
      if (
        recipe.tags.some((t) => t.toLowerCase().includes(p)) ||
        recipe.categoryLabel.toLowerCase().includes(p)
      ) {
        score += PRIORITY_BOOST;
      }
    }

    // Low-scent preference: reward recipes without essential oils.
    if (
      wantsLowScent &&
      !recipe.ingredients.some((i) => /essential oil|fragrance|perfume/i.test(i))
    ) {
      score += SCENT_FREE_BOOST;
      reasons.push('Low-scent');
    }

    // --- Penalties ------------------------------------------------------

    // Hard avoidance: recipe ingredient name overlaps with an avoidance term.
    for (const a of avoidances) {
      if (
        recipe.ingredients.some((i) =>
          extractIngredientName(i).includes(a),
        )
      ) {
        score += AVOIDANCE_PENALTY;
        break;
      }
    }

    return { recipe, score, reasons };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

/** Convenience: filter a recipe list to only those that pass a soft cutoff
 *  (positive or zero score). Use when you need a "for you" subset. */
export function filterForUser(
  recipes: Recipe[],
  profile: Profile | null,
): Recipe[] {
  return rankRecipes(recipes, profile)
    .filter((r) => r.score >= 0)
    .map((r) => r.recipe);
}

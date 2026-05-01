// Problem-driven entry path for the recipe catalog.
//
// Most apps surface recipes by category ("Cleaning", "Laundry") or by
// pantry contents ("what can I make right now"). This file adds a
// third lens — by intent ("what do I need to fix?") — which is often
// the most natural framing when a user opens the app: they have a
// problem (greasy stovetop, musty closet, sock stains) and want a
// recipe that solves it.
//
// Why inference instead of explicit tags:
// Hand-tagging every recipe with `problems: string[]` would mean
// touching 97 v3 entries plus all curated/seasonal additions and
// re-tagging on every catalog change. The set of problems is small
// and stable, so deriving from title + ingredients + tags + category
// is both simpler and more resilient. If a recipe shows up under the
// wrong problem (or misses one), tighten the regex below.

import { type Ionicons } from '@expo/vector-icons';

import type { Recipe } from './recipes';

export type ProblemId =
  | 'grease'
  | 'odor'
  | 'stains'
  | 'mold'
  | 'dust';

export type Problem = {
  id: ProblemId;
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Sage / amber / etc. so each chip reads as its own little zone. */
  tint: string;
  bg: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: 'grease',
    label: 'Grease & buildup',
    shortLabel: 'Grease',
    icon: 'flame-outline',
    tint: '#A98A4D',
    bg: '#F7F2E7',
  },
  {
    id: 'odor',
    label: 'Odor & freshness',
    shortLabel: 'Odor',
    icon: 'leaf-outline',
    tint: '#7E8F75',
    bg: '#E4EDE5',
  },
  {
    id: 'stains',
    label: 'Stains & spots',
    shortLabel: 'Stains',
    icon: 'water-outline',
    tint: '#6F5FA3',
    bg: '#EDE9F2',
  },
  {
    id: 'mold',
    label: 'Mold & mildew',
    shortLabel: 'Mold',
    icon: 'shield-checkmark-outline',
    tint: '#5C7F6B',
    bg: '#E0EAE2',
  },
  {
    id: 'dust',
    label: 'Dust & allergens',
    shortLabel: 'Dust',
    icon: 'sparkles-outline',
    tint: '#9C7A4F',
    bg: '#F1ECE0',
  },
];

export function findProblem(id: string | undefined): Problem | undefined {
  if (!id) return undefined;
  return PROBLEMS.find((p) => p.id === id);
}

/** Treat unknown values as null instead of throwing. */
export function asProblemId(value: unknown): ProblemId | null {
  if (typeof value !== 'string') return null;
  return PROBLEMS.some((p) => p.id === value) ? (value as ProblemId) : null;
}

// =============================================================================
// Inference
// =============================================================================
//
// Each problem has a regex that runs over a recipe's title, ingredient
// list, tags, and categoryKey concatenated into a single lowercase
// string. The patterns are intentionally generous — false positives
// here just mean a recipe shows up in a related list, which is
// usually fine. False negatives are worse (the user thinks the app
// has nothing for their problem), so prefer broader regex over tight.

const PROBLEM_PATTERNS: Record<ProblemId, RegExp> = {
  grease: /\b(grease|degreas|stovetop|oven|range hood|burner|kitchen spray|kitchen-spray|burnt|range)\b/,
  // Odor-specific terms only; the category-key fallback below catches
  // the broader home-air-freshening lineup so generic "spray" doesn't
  // sweep up All-Purpose Spray and friends.
  odor: /\b(odor|odour|deodor|freshener|sachet|simmer|linen spray|room spray|drain freshener|drain refresh|carpet powder|closet|reed diffuser)\b/,
  stains:
    /\b(stain|whites|brightener|stick|booster|spot cleaner|wall spot|laundry boost)\b/,
  mold: /\b(mold|mildew|peroxide|tea tree|hydrogen peroxide|tile cleaner)\b/,
  dust: /\b(dust|baseboard|allergen|wood polish|wood-polish|leaf shine|furniture cream)\b/,
};

function buildHaystack(recipe: Recipe): string {
  const parts = [
    recipe.title,
    recipe.categoryLabel,
    recipe.categoryKey,
    ...recipe.ingredients,
    ...recipe.tags,
  ];
  return parts.join(' ').toLowerCase();
}

/** True if a recipe is a reasonable answer to the given problem. */
export function recipeMatchesProblem(
  recipe: Recipe,
  problemId: ProblemId,
): boolean {
  const haystack = buildHaystack(recipe);
  // Special-case categoryKey routing — odors lean heavily on the
  // home-air-freshening category whose recipes often don't use the
  // word "odor" in their title.
  if (problemId === 'odor' && recipe.categoryKey === 'home-air-freshening') {
    return true;
  }
  return PROBLEM_PATTERNS[problemId].test(haystack);
}

/** Returns every problem this recipe is a reasonable answer to. */
export function problemsForRecipe(recipe: Recipe): ProblemId[] {
  return PROBLEMS.filter((p) => recipeMatchesProblem(recipe, p.id)).map(
    (p) => p.id,
  );
}

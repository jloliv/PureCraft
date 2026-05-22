// Recipe-aware ingredient recommendations — powers the three-section
// Tailor It pantry UI (Your Pantry / Recommended for This Formula /
// Missing for Best Results).
//
// Why this lives in /lib instead of inline in preferences.tsx:
//   - The same buckets will drive the upcoming shopping-list integration
//     (Missing → buy list) and the AI-formula generator's ingredient
//     selection. Centralizing the logic keeps those consumers consistent.
//   - Easy to test as a pure function.
//
// Inputs:
//   recipe   — the canonical Recipe object (hero or v3 bridge — we only
//              read .ingredients and optionally .title / .categoryKey).
//   pantry   — the live pantry id Set from usePantry().
//   strength — optional Tailor It strength control; biases recommendations
//              toward / away from strengthBoost ingredients.
//
// Outputs three disjoint groups of canonical Ingredient objects:
//   inPantry    — pantry items that are required by this recipe.
//   recommended — catalog items NOT in pantry and NOT in the recipe's
//                 literal ingredient list, whose useCases match the
//                 recipe's intent tags. The "smart additions" bucket.
//   missing     — recipe-required ingredients the user doesn't have yet.

import {
  INGREDIENTS,
  type Ingredient,
  type ScentProfile,
} from '@/constants/ingredients';
import { pantryKeyForIngredient } from './pantry-match';

export type StrengthLevel = 'gentle' | 'balanced' | 'strong';

/** Anything with a title, ingredient list, and (optional) categoryKey.
 *  Matches both the hero Recipe in constants/products.ts and the v3
 *  Recipe in constants/recipes.ts without forcing either to converge. */
type RecipeLike = {
  title: string;
  ingredients: { name: string; amount?: string }[];
  categoryKey?: string;
};

export type RecommendationInputs = {
  recipe: RecipeLike;
  pantry: Set<string>;
  strength?: StrengthLevel;
  /** Reserved for future preferences (allergy-aware, fragrance-free,
   *  eco-mode). Filters are applied if provided — caller doesn't need to
   *  pass anything until those toggles are wired in the UI. */
  preferences?: {
    allergySafe?: boolean;
    fragranceFree?: boolean;
    ecoOnly?: boolean;
  };
};

export type IngredientGroups = {
  inPantry: Ingredient[];
  recommended: Ingredient[];
  missing: Ingredient[];
};

// Map recipe-title / categoryKey substrings → use-case tags. The right
// side is what we'll look for in INGREDIENTS[i].useCases. Keep keys lower-
// cased — we substring-match against a lowercased title/categoryKey blob.
const INTENT_KEYWORDS: Record<string, string> = {
  // Cleaning surfaces / targets
  mold: 'mold',
  mildew: 'mold',
  bathroom: 'bathroom',
  shower: 'bathroom',
  tile: 'bathroom',
  toilet: 'bathroom',
  glass: 'glass',
  mirror: 'glass',
  window: 'glass',
  wood: 'wood',
  furniture: 'wood',
  leather: 'leather',
  kitchen: 'kitchen',
  counter: 'kitchen',
  stove: 'kitchen',
  oven: 'kitchen',
  grease: 'grease',
  degreas: 'grease',
  floor: 'floor',
  drain: 'drain',
  // Laundry
  laundry: 'laundry',
  stain: 'stain',
  detergent: 'laundry',
  fabric: 'laundry',
  // Home / air
  candle: 'home-scent',
  freshen: 'home-scent',
  diffuser: 'home-scent',
  spray: 'home-scent',
  room: 'home-scent',
  linen: 'home-scent',
  air: 'home-scent',
  // Personal care
  baby: 'baby',
  diaper: 'baby',
  pet: 'pet',
  skin: 'skin',
  face: 'skin',
  lotion: 'skin',
  butter: 'skin',
  scrub: 'scrub',
  lip: 'lip',
  hair: 'hair',
  shampoo: 'hair',
  conditioner: 'hair',
  // Function tags
  odor: 'odor',
  deodor: 'odor',
  disinfect: 'disinfect',
  sanitiz: 'disinfect',
  antibacterial: 'disinfect',
  pest: 'pest',
  repell: 'pest',
};

/** Derive intent tags from the recipe's title + categoryKey. Returns a
 *  Set so consumers can dedupe / cheap-check membership. */
export function intentTagsFromRecipe(recipe: RecipeLike): Set<string> {
  const blob = `${recipe.title} ${recipe.categoryKey ?? ''}`.toLowerCase();
  const tags = new Set<string>();
  for (const [needle, tag] of Object.entries(INTENT_KEYWORDS)) {
    if (blob.includes(needle)) tags.add(tag);
  }
  // categoryKey often carries its own implicit tags. Map a few known
  // values explicitly so a recipe titled "Body Butter" under categoryKey
  // 'beauty-skincare' picks up the right intent even if the title is
  // ambiguous.
  const key = recipe.categoryKey ?? '';
  if (key.includes('beauty') || key.includes('hair')) tags.add('skin');
  if (key.includes('hair')) tags.add('hair');
  if (key === 'home-air-freshening') tags.add('home-scent');
  if (key === 'baby-family-safe') tags.add('baby');
  if (key === 'pet-safe') tags.add('pet');
  return tags;
}

/** Resolve the set of canonical Ingredient ids referenced by a recipe's
 *  free-text ingredient list. Items that fail to resolve are silently
 *  dropped — the missing list only shows things we can match against the
 *  pantry, which is the same constraint other recipe-vs-pantry features
 *  already accept. */
function recipeIngredientIds(recipe: RecipeLike): Set<string> {
  const ids = new Set<string>();
  for (const ing of recipe.ingredients) {
    const text = ing.amount ? `${ing.amount} ${ing.name}` : ing.name;
    const id = pantryKeyForIngredient(text);
    if (id) ids.add(id);
  }
  return ids;
}

/** Filter helper for the preferences object — currently used for the
 *  allergy-aware preset. Wraps the predicate so future toggles slot in. */
function passesPreferences(
  ing: Ingredient,
  prefs?: RecommendationInputs['preferences'],
): boolean {
  if (!prefs) return true;
  if (prefs.allergySafe && ing.allergySafe === false) return false;
  if (prefs.fragranceFree && ing.scentProfile && ing.scentProfile !== null) {
    return false;
  }
  if (prefs.ecoOnly && ing.ecoFriendly === false) return false;
  return true;
}

/** Score an ingredient against the recipe's intent. Higher = more
 *  relevant. Used only for ordering — items with score 0 are excluded
 *  from `recommended`. */
function scoreForIntent(ing: Ingredient, intent: Set<string>): number {
  if (!ing.useCases || ing.useCases.length === 0) return 0;
  let hits = 0;
  for (const u of ing.useCases) {
    if (intent.has(u)) hits++;
  }
  return hits;
}

export function recommendForRecipe(
  inputs: RecommendationInputs,
): IngredientGroups {
  const { recipe, pantry, strength, preferences } = inputs;
  const intent = intentTagsFromRecipe(recipe);
  const recipeIds = recipeIngredientIds(recipe);

  // 1. inPantry = pantry items required by this recipe.
  const inPantry: Ingredient[] = [];
  for (const id of recipeIds) {
    if (!pantry.has(id)) continue;
    const ing = INGREDIENTS.find((i) => i.id === id);
    if (!ing) continue;
    if (!passesPreferences(ing, preferences)) continue;
    inPantry.push(ing);
  }

  // 2. missing = recipe ingredients NOT in pantry.
  const missing: Ingredient[] = [];
  for (const id of recipeIds) {
    if (pantry.has(id)) continue;
    const ing = INGREDIENTS.find((i) => i.id === id);
    if (!ing) continue;
    if (!passesPreferences(ing, preferences)) continue;
    missing.push(ing);
  }

  // 3. recommended = catalog items matching intent, NOT in recipe, NOT
  //    in pantry. Tools (vessels) are excluded — they're not ingredients
  //    in any meaningful sense.
  const scored: { ing: Ingredient; score: number }[] = [];
  for (const ing of INGREDIENTS) {
    if (recipeIds.has(ing.id)) continue;
    if (pantry.has(ing.id)) continue;
    if (ing.group === 'tools') continue;
    if (!passesPreferences(ing, preferences)) continue;
    const score = scoreForIntent(ing, intent);
    if (score <= 0) continue;
    scored.push({ ing, score });
  }

  // Strength bias: 'gentle' drops strengthBoost items; 'strong' nudges
  // them upward.
  const biased = scored
    .filter(({ ing }) => {
      if (strength === 'gentle' && ing.strengthBoost) return false;
      return true;
    })
    .map(({ ing, score }) => ({
      ing,
      score: score + (strength === 'strong' && ing.strengthBoost ? 1 : 0),
    }));

  biased.sort((a, b) => b.score - a.score);
  const recommended = biased.slice(0, 6).map((s) => s.ing);

  return { inPantry, recommended, missing };
}

/** Convenience re-export for screens that want to surface scent in a
 *  pill / chip. Kept here so consumers don't have to dig into
 *  constants/ingredients.ts for the type. */
export type { ScentProfile };

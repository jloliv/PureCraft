// Ingredient icon registry — maps an Ingredient.icon key to either an
// image asset or null (no asset registered).
//
// The matching PNG assets called out in the spec — vinegar.png,
// baking.png, soap.png, etc. — don't exist in assets/images yet.
// Rather than hard-fail on `require()` for missing files, this
// registry lets us:
//
//   1. Ship the system today: every ingredient renders its emoji
//      fallback, no UI regression.
//   2. Drop in assets incrementally: drop vinegar.png into
//      assets/images, change null → require('...'), done. No UI code
//      changes.
//
// Use ingredientIcon(ingredient) from a screen to get the right
// renderable — it returns either an ImageSourcePropType (use <Image>)
// or null (use the ingredient's emoji as a Text fallback).

import type {
  Ingredient,
  IngredientIconKey,
  ImageSourcePropType,
} from './ingredients';

// All known icon keys. Keep in sync with IngredientIconKey in
// constants/ingredients.ts so the type system catches typos.
//
// To add a real asset:
//   1. Drop the PNG in assets/images (transparent, square, ~96px).
//   2. Change null to require('../assets/images/yourfile.png').
//   3. (Optional) Add a comment if the asset name doesn't match the
//      key (e.g. the onboarding screen uses 'Instagram-icon.png' for
//      Instacart — same pattern would apply here).
const REGISTRY: Record<IngredientIconKey, ImageSourcePropType | null> = {
  water: null,
  vinegar: null,
  baking: null,
  soap: null,
  bottle: null,
  lemon: null,
  lavender: null,
  dropper: null,
  jar: null,
  leaf: null,
  powder: null,
  salt: null,
  oil: null,
};

/** Returns the registered image for an ingredient, or null when no
 *  asset is registered (caller should render the emoji fallback). */
export function ingredientIcon(
  ingredient: Pick<Ingredient, 'icon'>,
): ImageSourcePropType | null {
  return REGISTRY[ingredient.icon] ?? null;
}

/** Lookup by raw key — useful for tests / debug. */
export function ingredientIconByKey(
  key: IngredientIconKey,
): ImageSourcePropType | null {
  return REGISTRY[key] ?? null;
}

export const INGREDIENT_ICONS = REGISTRY;

// Hero image registry for the recipe detail screen.
//
// Heroes are intentionally separate from grid thumbnails:
//   - Thumbnails (constants/recipeImages.ts -> RECIPE_IMAGES) are clean
//     product shots that read well at 80x80 inside a colored swatch.
//   - Heroes (this file) are lifestyle / scene photos sized for a
//     full-width 340-tall hero on the detail screen.
//
// Same recipe ID, different composition. See assets/hero-images/README.md
// for the folder/naming convention.
//
// Registration is explicit because Metro can't resolve `require()` paths
// dynamically — every asset reference has to be a literal string. Add
// new entries here as you generate hero photos. Until a hero is added,
// recipeHeroImage() falls back to recipeIcon() so the screen always has
// something to render.

import type { ImageSourcePropType } from 'react-native';

import { recipeIcon } from '@/lib/recipe-icons';

// Map: recipe ID (slug) -> hero image source.
//
// Add entries one at a time as you produce hero photos. The keys must
// match recipe IDs exactly (the slug used by router params and
// recipeIcon lookups).
export const RECIPE_HERO_IMAGES: Record<string, ImageSourcePropType> = {
  // Example (uncomment and create the file under assets/hero-images/
  // before enabling):
  //   'stainless-steel-spray': require('../assets/hero-images/stainless-steel-spray.png'),
};

/**
 * Resolve the hero image for a recipe.
 *
 * Returns a registered hero photo if one exists, otherwise falls back to
 * the regular thumbnail/icon so the hero area never renders empty. The
 * `categoryKey` argument is forwarded to `recipeIcon` so the fallback
 * chain can use a category icon when a recipe has no dedicated asset
 * either.
 */
export function recipeHeroImage(
  recipeId: string,
  categoryKey?: string,
): ImageSourcePropType {
  const hero = RECIPE_HERO_IMAGES[recipeId];
  if (hero) return hero;
  return recipeIcon(recipeId, categoryKey);
}

/** Returns true when the recipe has a dedicated hero image registered. */
export function hasRecipeHeroImage(recipeId: string): boolean {
  return Boolean(RECIPE_HERO_IMAGES[recipeId]);
}

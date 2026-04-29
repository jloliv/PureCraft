import { Platform, type ImageSourcePropType, type ImageStyle } from 'react-native';

// On web, RN-Web renders <Image> as a wrapper <div> with a background-image
// + a hidden <img> for accessibility. Targeting the visible wrapper requires
// a testID (which RN-Web maps to data-testid). We inject one global rule so
// every recipe-icon Image blends through to its pastel card background.
export const RECIPE_ICON_TEST_ID = 'pc-recipe-icon';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const STYLE_ID = 'purecraft-recipe-icon-blend';
  if (!document.getElementById(STYLE_ID)) {
    const tag = document.createElement('style');
    tag.id = STYLE_ID;
    // RN-Web renders <Image> as a wrapper [data-testid] with two children:
    //   1. a <div> whose background-image is the actual visible art,
    //   2. an invisible <img> for accessibility.
    // The visible div is what we need to blend.
    // `darken` is more forgiving than `multiply` when the JPG background isn't
    // perfectly white — it keeps whichever channel is darker, so any off-white
    // tint in the asset renders as the pastel swatch color, while line art
    // pixels stay dark.
    tag.textContent = `
      [data-testid="${RECIPE_ICON_TEST_ID}"] > div {
        mix-blend-mode: darken !important;
      }
    `;
    document.head.appendChild(tag);
  }
}

// Single source of truth for the PureCraft thin-line illustration mapping.
// One map, used everywhere a recipe card renders its top-panel artwork.
//
// NOTE on transparency: most source files are .jpg (no alpha) so they ship
// with a white rectangle baked in. On web we hide that rectangle with
// `mix-blend-mode: multiply` — multiplying white by any pastel card color
// returns the pastel, so the line art reads as if printed onto the card.
// For native platforms, re-export the assets as PNG with transparent
// backgrounds; the blend mode is a no-op there.
// IDs that map to a real PHOTO asset (assets/Recipes/*) rather than a
// line-art illustration. Render sites can branch on this to use cover-fill
// + skip the line-art `mix-blend-mode: darken` web hack.
export const PHOTO_RECIPES: Set<string> = new Set([
  // v3 launch-recipe numeric IDs
  '1', // All Purpose Spray
  '2', // Bathroom Scrub
  '3', // Toilet Bombs
  '5', // Stainless Steel Spray
  '7', // Tile Cleaner
  '8', // Shower Spray
  '9', // Mold Vinegar Spray
  '10', // Drain Freshener
  '11', // Microwave Steam Cleaner
  '14', // Dusting Spray
  '15', // Wood Polish
  '17', // Carpet Powder
  '20', // Refrigerator Deodorizer
  '26', // Sugar Body Scrub
  '27', // Coffee Scrub
  '38', // Shaving Scrub
  '55', // Baby Lotion
  '61', // Sink Scrub
  '63', // Grease Cutter
  // Catalog products with dedicated photos
  'floor-cleaner',
  'citrus-glow-scrub',
  'room-spray',
  'laundry-booster',
]);

export function isRecipePhoto(productId: string): boolean {
  return PHOTO_RECIPES.has(productId);
}

const ICONS: Record<string, ImageSourcePropType> = {
  'safer-cleaning': require('../assets/icons/safer-cleaning.png'),
  'better-skin-care': require('../assets/icons/better-skin-care.png'),
  'luxury-home-scents': require('../assets/icons/luxury-home-scents.png'),
  'save-money': require('../assets/icons/save-money.png'),
  'allergy-friendly': require('../assets/icons/allergy-friendly.png'),
  'eco-living': require('../assets/icons/eco-living.png'),
  'diy-beauty': require('../assets/icons/diy-beauty.png'),
  'wellness-routines': require('../assets/icons/wellness-routines.png'),
  'bathroom-cleaner': require('../assets/icons/soap-icon.png'),
  'glass-cleaner': require('../assets/icons/window-recipe-icon.png'),
  'kitchen-spray': require('../assets/icons/lemonSpray-recipe-icon.png'),
  'floor-cleaner': require('../assets/Recipes/floor-cleaner.png'),
  'laundry-booster': require('../assets/Recipes/laundry-booster.png'),
  'room-spray': require('../assets/Recipes/room-spray.png'),
  'sugar-scrub': require('../assets/icons/scrubs-icon.png'),
  'citrus-glow-scrub': require('../assets/Recipes/Citrus-glow-scrub.png'),
  'body-butter': require('../assets/icons/lotion-icon.png'),
  candle: require('../assets/icons/candle-icon.png'),
  'linen-spray': require('../assets/icons/mist-icon.png'),

  // v3 launch recipes — numeric-string IDs paired with real photos.
  '1': require('../assets/Recipes/all-purpose-spray.png'),
  '2': require('../assets/Recipes/bathroom-scrub.png'),
  '3': require('../assets/Recipes/toilet-bombs.png'),
  '5': require('../assets/Recipes/stainless-steel-spray.png'),
  '7': require('../assets/Recipes/tile-cleaner.png'),
  '8': require('../assets/Recipes/shower-spray.png'),
  '9': require('../assets/Recipes/mold-vinegar-spray.png'),
  // Filename has a typo in the source assets ("refreshner") — keeping as-is
  // to match disk; safe to rename when the asset is re-exported.
  '10': require('../assets/Recipes/drain-refreshner.png'),
  '11': require('../assets/Recipes/microwave-steam-cleaner.png'),
  '14': require('../assets/Recipes/dusting-spray.png'),
  '15': require('../assets/Recipes/wood-polish.png'),
  '17': require('../assets/Recipes/carpet-powder.png'),
  '20': require('../assets/Recipes/refrigerator-deodorizer.png'),
  '26': require('../assets/Recipes/sugar-body-scrub.png'),
  '27': require('../assets/Recipes/coffee-scrub.png'),
  '38': require('../assets/Recipes/shaving-scrub.png'),
  '55': require('../assets/Recipes/baby-lotion.png'),
  '61': require('../assets/Recipes/sink-scrub.png'),
  '63': require('../assets/Recipes/grease-cutter.png'),
};

const FALLBACK: ImageSourcePropType = require('../assets/icons/spray-recipe-icon.png');

// For v3 launch recipes (numeric-string IDs), fall back to a category-shaped
// illustration so the entire 100-recipe catalog has consistent artwork.
const ICONS_BY_CATEGORY: Record<string, ImageSourcePropType> = {
  cleaning: require('../assets/icons/spray-recipe-icon.png'),
  laundry: require('../assets/icons/laundry-detergent-icon.png'),
  'beauty-skincare': require('../assets/icons/lotion-icon.png'),
  'hair-care': require('../assets/icons/lotion-icon.png'),
  'baby-family-safe': require('../assets/icons/soap-icon.png'),
  'home-air-freshening': require('../assets/icons/mist-icon.png'),
  'pet-safe': require('../assets/icons/spray-recipe-icon.png'),
  'garden-outdoor': require('../assets/icons/floors-recipe.png'),
  'seasonal-holiday': require('../assets/icons/candle-icon.png'),
  'emergency-budget-hacks': require('../assets/icons/spray-recipe-icon.png'),
};

export function recipeIcon(
  productId: string,
  categoryKey?: string,
): ImageSourcePropType {
  if (ICONS[productId]) return ICONS[productId];
  if (categoryKey && ICONS_BY_CATEGORY[categoryKey]) {
    return ICONS_BY_CATEGORY[categoryKey];
  }
  return FALLBACK;
}

export function categoryIcon(categoryKey: string): ImageSourcePropType {
  return ICONS_BY_CATEGORY[categoryKey] ?? FALLBACK;
}

// Empty style — kept for backwards compat; the actual blend is applied via
// the global CSS injected above, targeted by RECIPE_ICON_TEST_ID.
export const RECIPE_ICON_BLEND: ImageStyle = {};

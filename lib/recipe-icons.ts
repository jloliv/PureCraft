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
  // v3 launch-recipe numeric IDs (49 mapped)
  '1', '2', '3', '4', '5', '7', '8', '9', '10', '11',
  '13', '14', '15', '16', '17', '18', '20',
  '26', '27', '28', '30', '31', '32', '33', '34', '35', '36',
  '38', '39', '45', '52', '55', '56', '58', '60', '61', '63',
  '71', '73', '75', '76', '77', '78', '79',
  '82', '83', '84', '86', '87', '88', '97',
  // Catalog products with dedicated photos
  'bathroom-cleaner',
  'glass-cleaner',
  'kitchen-spray',
  'floor-cleaner',
  'laundry-booster',
  'room-spray',
  'sugar-scrub',
  'citrus-glow-scrub',
  'candle',
  'linen-spray',
]);

export function isRecipePhoto(productId: string): boolean {
  return PHOTO_RECIPES.has(productId);
}

const ICONS: Record<string, ImageSourcePropType> = {
  // Onboarding intent tiles + non-recipe illustrations.
  'safer-cleaning': require('../assets/icons/safer-cleaning.png'),
  'better-skin-care': require('../assets/icons/better-skin-care.png'),
  'luxury-home-scents': require('../assets/icons/luxury-home-scents.png'),
  'save-money': require('../assets/icons/save-money.png'),
  'allergy-friendly': require('../assets/icons/allergy-friendly.png'),
  'eco-living': require('../assets/icons/eco-living.png'),
  'diy-beauty': require('../assets/icons/diy-beauty.png'),
  'wellness-routines': require('../assets/icons/wellness-routines.png'),

  // Catalog products — photos where available, else line-art fallback.
  'bathroom-cleaner': require('../assets/Recipes/bathroom-cleaner.png'),
  'glass-cleaner': require('../assets/Recipes/glass-cleaner3.png'),
  'kitchen-spray': require('../assets/Recipes/kitchen-spray.png'),
  'floor-cleaner': require('../assets/Recipes/floor-cleaner.png'),
  'laundry-booster': require('../assets/Recipes/laundry-booster.png'),
  'room-spray': require('../assets/Recipes/room-spray.png'),
  'sugar-scrub': require('../assets/Recipes/sugar-scrub.png'),
  'citrus-glow-scrub': require('../assets/Recipes/Citrus-glow-scrub.png'),
  'body-butter': require('../assets/icons/lotion-icon.png'), // no photo yet
  candle: require('../assets/Recipes/soy-candle.png'),
  'linen-spray': require('../assets/Recipes/linen-mist.png'),

  // v3 launch recipes — numeric-string IDs paired with real photos.
  '1': require('../assets/Recipes/all-purpose-spray.png'),
  '2': require('../assets/Recipes/bathroom-scrub.png'),
  '3': require('../assets/Recipes/toilet-bombs.png'),
  '4': require('../assets/Recipes/glass-cleaner3.png'),
  '5': require('../assets/Recipes/stainless-steel-spray.png'),
  '7': require('../assets/Recipes/tile-cleaner.png'),
  '8': require('../assets/Recipes/shower-spray.png'),
  '9': require('../assets/Recipes/mold-vinegar-spray.png'),
  // Filename has a typo in the source assets ("refreshner") — keeping as-is.
  '10': require('../assets/Recipes/drain-refreshner.png'),
  '11': require('../assets/Recipes/microwave-steam-cleaner.png'),
  '13': require('../assets/Recipes/baseboard-wipes.png'),
  '14': require('../assets/Recipes/dusting-spray.png'),
  '15': require('../assets/Recipes/wood-polish.png'),
  '16': require('../assets/Recipes/floor-cleaner.png'),
  '17': require('../assets/Recipes/carpet-powder.png'),
  '18': require('../assets/Recipes/mattress-refresh-powder.png'),
  '20': require('../assets/Recipes/refrigerator-deodorizer.png'),
  '26': require('../assets/Recipes/sugar-body-scrub.png'),
  '27': require('../assets/Recipes/coffee-scrub.png'),
  '28': require('../assets/Recipes/lip-balm.png'),
  '30': require('../assets/Recipes/oatmeal-face-mask.png'),
  '31': require('../assets/Recipes/clay-mask.png'),
  '32': require('../assets/Recipes/rosewater-toner.png'),
  '33': require('../assets/Recipes/makeup-brush-cleaner.png'),
  '34': require('../assets/Recipes/foot-soak.png'),
  '35': require('../assets/Recipes/cuticle-oil.png'),
  '36': require('../assets/Recipes/bath-salts.png'),
  '38': require('../assets/Recipes/shaving-scrub.png'),
  '39': require('../assets/Recipes/aloe-gel-mist.png'),
  '45': require('../assets/Recipes/dry-shampoo.png'),
  '52': require('../assets/Recipes/toy-cleaner-spray.png'),
  '55': require('../assets/Recipes/baby-lotion.png'),
  '56': require('../assets/Recipes/kids-bubble-bath.png'),
  '58': require('../assets/Recipes/no-tear-shampoo.png'),
  '60': require('../assets/Recipes/diaper-rash-balm.png'),
  '61': require('../assets/Recipes/sink-scrub.png'),
  '63': require('../assets/Recipes/grease-cutter.png'),
  '71': require('../assets/Recipes/linen-mist.png'),
  '73': require('../assets/Recipes/simmer-pot-spice-blend.png'),
  '75': require('../assets/Recipes/candle-wax-melts.png'),
  '76': require('../assets/Recipes/reed-diffuser.png'),
  '77': require('../assets/Recipes/car-freshner.png'),
  '78': require('../assets/Recipes/shoe-deodorizer.png'),
  '79': require('../assets/Recipes/pet-bed-spray.png'),
  '82': require('../assets/Recipes/litter-box-freshner.png'),
  '83': require('../assets/Recipes/pet-toy-cleaner.png'),
  '84': require('../assets/Recipes/weed-vinegar-spray.png'),
  '86': require('../assets/Recipes/bug-repellant-spray.png'),
  '87': require('../assets/Recipes/plant-leaf-shine.png'),
  '88': require('../assets/Recipes/outdoor-furniture-wash.png'),
  '97': require('../assets/Recipes/closet-moisture-absorber.png'),
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

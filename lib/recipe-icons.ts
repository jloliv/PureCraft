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
const ICONS: Record<string, ImageSourcePropType> = {
  'bathroom-cleaner': require('../assets/soap-recipe-icon.jpg'),
  'glass-cleaner': require('../assets/window-recipe-icon.jpg'),
  'kitchen-spray': require('../assets/lemonSpray-recipe-icon.jpg'),
  'floor-cleaner': require('../assets/floors-recipe.jpg'),
  'laundry-booster': require('../assets/laundry-recipe-icon.jpg'),
  'room-spray': require('../assets/scent-recipe-icon.jpg'),
  'sugar-scrub': require('../assets/scrub-recipe-icon.jpg'),
  'body-butter': require('../assets/lotion-soap-recipe-icon.jpg'),
  candle: require('../assets/candles-recipe-icon.jpg'),
  'linen-spray': require('../assets/mist-recipe-icon.png'),
};

const FALLBACK: ImageSourcePropType = require('../assets/spray-recipe-icon.jpg');

export function recipeIcon(productId: string): ImageSourcePropType {
  return ICONS[productId] ?? FALLBACK;
}

// Empty style — kept for backwards compat; the actual blend is applied via
// the global CSS injected above, targeted by RECIPE_ICON_TEST_ID.
export const RECIPE_ICON_BLEND: ImageStyle = {};

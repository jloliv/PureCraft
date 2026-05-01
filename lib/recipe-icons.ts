import { Platform, type ImageSourcePropType, type ImageStyle } from 'react-native';

import { RECIPE_FALLBACK_IMAGE, RECIPE_IMAGES } from '@/constants/recipeImages';

// On web, RN-Web renders <Image> as a wrapper <div> with a background-image
// + a hidden <img> for accessibility. Targeting the visible wrapper requires
// a testID (which RN-Web maps to data-testid).
export const RECIPE_ICON_TEST_ID = 'pc-recipe-icon';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const STYLE_ID = 'purecraft-recipe-icon-blend';
  if (!document.getElementById(STYLE_ID)) {
    const tag = document.createElement('style');
    tag.id = STYLE_ID;
    tag.textContent = `
      [data-testid="${RECIPE_ICON_TEST_ID}"] > div {
        mix-blend-mode: darken !important;
      }
    `;
    document.head.appendChild(tag);
  }
}

const CATEGORY_ICONS: Record<string, ImageSourcePropType> = {
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

export function isRecipePhoto(productId: string): boolean {
  return Boolean(RECIPE_IMAGES[productId]);
}

export function recipeIcon(
  productId: string,
  categoryKey?: string,
): ImageSourcePropType {
  if (RECIPE_IMAGES[productId]) return RECIPE_IMAGES[productId];
  if (categoryKey && CATEGORY_ICONS[categoryKey]) {
    return CATEGORY_ICONS[categoryKey];
  }
  return RECIPE_FALLBACK_IMAGE;
}

export function categoryIcon(categoryKey: string): ImageSourcePropType {
  return CATEGORY_ICONS[categoryKey] ?? RECIPE_FALLBACK_IMAGE;
}

// Empty style — kept for backwards compat; the actual blend is applied via
// the global CSS injected above, targeted by RECIPE_ICON_TEST_ID.
export const RECIPE_ICON_BLEND: ImageStyle = {};

import type { ImageSourcePropType } from 'react-native';

export const INTENT_IMAGES: Record<string, ImageSourcePropType> = {
  'safer-cleaning': require('../assets/images/safe-cleaning-icon.png'),
  'better-skin-care': require('../assets/images/better-skin-care.png'),
  'luxury-home-scents': require('../assets/images/luxury-home-scents.png'),
  'save-money': require('../assets/images/save-money.png'),
  'allergy-friendly': require('../assets/images/allergy-friendly.png'),
  'eco-living': require('../assets/images/eco-living.png'),
  'diy-beauty': require('../assets/images/DIY-beauty.png'),
  'wellness-routines': require('../assets/images/wellness-routines.png'),
  'create-recipes': require('../assets/images/create-recipes.png'),
};

export const INTENT_IMAGE_FALLBACK = INTENT_IMAGES['diy-beauty'];

// Full-width hero image used at the top of recipe detail screens.
//
// The component is intentionally minimal: it renders a single edge-to-edge
// image at a fixed height. Title, subtitle, tags and any floating action
// buttons (close, share, save) are rendered by the parent screen — the
// design treats the hero as a photograph and lets typography sit on the
// page background beneath it (no overlay, no gradient).
//
// Drop-in usage:
//   <RecipeHero image={recipeIcon(product.id)} />
//
// If a screen wants the image to break out of a horizontally-padded
// ScrollView, the parent should apply `marginHorizontal: -<padding>`
// since this component renders width: '100%' against its container.

import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const HERO_HEIGHT = 340;
// Soft neutral fallback shown while the image loads or if it fails. Matches
// the warm cream that recipe screens use as their page background.
const HERO_FALLBACK_BG = '#EFEAE0';

export type RecipeHeroProps = {
  /** Image source resolved by the caller (e.g. recipeIcon(recipe.id)). */
  image: ImageSourcePropType;
  /**
   * Optional — present in props for forward compatibility with screens that
   * may want to render an overlay variant later. Not displayed by default
   * because the current design places title/subtitle below the hero.
   */
  title?: string;
  subtitle?: string;
  /** Extra style applied to the outer container (e.g. negative margins to
   *  break out of a padded scroll view). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function RecipeHero({
  image,
  style,
  testID,
}: RecipeHeroProps) {
  return (
    <View style={[styles.container, style]} testID={testID ?? 'pc-recipe-hero'}>
      <Image
        source={image}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: HERO_FALLBACK_BG,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export const RECIPE_HERO_HEIGHT = HERO_HEIGHT;

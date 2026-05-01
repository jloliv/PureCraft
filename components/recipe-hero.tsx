// Full-bleed recipe hero used at the top of the recipe detail screen.
//
// Visual model: the photo, a fade-down gradient, and the title/subtitle
// are all rendered as ONE block. The gradient's terminal stop matches
// the page background (BACKGROUND_PRIMARY) so the bottom of the hero
// blends into the screen with no visible seam — there's no hard edge
// where "image ends" and "content begins".
//
// Drop-in usage:
//   <RecipeHero
//     image={recipeHeroImage(recipe.id, recipe.categoryKey)}
//     title={recipe.title}
//     subtitle={recipe.blurb ?? 'Spray lightly'}
//   />

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BACKGROUND_PRIMARY } from '@/constants/theme';

const HERO_HEIGHT = 360;

export type RecipeHeroProps = {
  image: ImageSourcePropType;
  title: string;
  subtitle?: string;
  /** Extra style applied to the outer container (e.g. negative margins
   *  to break out of a padded scroll view). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function RecipeHero({
  image,
  title,
  subtitle,
  style,
  testID,
}: RecipeHeroProps) {
  return (
    <View style={[styles.container, style]} testID={testID ?? 'pc-recipe-hero'}>
      <ImageBackground
        source={image}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      >
        {/* Light-only fade: top ~65% of the photo stays fully clear so
            the product reads sharply, then a soft white wash blends the
            lower third into the page background. Terminal stop is the
            actual page bg color (not pure white) so the hero's bottom
            edge has no visible seam against the page. */}
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.1)',
            'rgba(255,255,255,0.6)',
            BACKGROUND_PRIMARY,
          ]}
          locations={[0, 0.65, 0.85, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    // alignSelf: 'stretch' (not width: '100%') is what lets the parent
    // pull this hero edge-to-edge with negative horizontal margins. With
    // an explicit width: '100%' the box is constrained to the parent's
    // post-padding content area and the negative margins only shift it,
    // leaving a visible gap on one side.
    alignSelf: 'stretch',
    backgroundColor: BACKGROUND_PRIMARY,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  textContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: '#1E1E1E',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    color: '#6B6B6B',
  },
});

export const RECIPE_HERO_HEIGHT = HERO_HEIGHT;

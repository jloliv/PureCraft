import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { formatMoney, useCurrency } from '@/constants/currency';
import type { Ingredient } from '@/constants/ingredients';
import { findProduct, findRecipe } from '@/constants/products';
import { useAllRecipes } from '@/constants/recipes-remote';
import { recipeHeroImage } from '@/constants/recipeHeroImages';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';
import { recommendForRecipe } from '@/lib/ingredient-recommendations';
import { togglePantryItem, usePantry } from '@/lib/pantry-store';

// LayoutAnimation is enabled by default on iOS; Android needs the
// experimental flag flipped once per app. Matches the pattern used in
// app/help-center.tsx so we stay consistent across screens.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Pref = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap };

const PREFS: Pref[] = [
  { key: 'baby-safe', label: 'Baby-safe', icon: 'happy-outline' },
  { key: 'pet-safe', label: 'Pet-safe', icon: 'paw-outline' },
  { key: 'allergy-aware', label: 'Allergy-aware', icon: 'medkit-outline' },
  { key: 'fragrance-free', label: 'Fragrance-free', icon: 'leaf-outline' },
  { key: 'budget', label: 'Budget-friendly', icon: 'cash-outline' },
  { key: 'natural', label: 'Natural', icon: 'flower-outline' },
  { key: 'strongest', label: 'Strongest cleaning', icon: 'flash-outline' },
];

type PantryRowVariant = 'selected' | 'recommended' | 'missing';

/** Single row in the three-section pantry list. Visual treatment varies
 *  by variant; section labels (rendered above the list) carry the meaning
 *  so each row stays minimal — just an icon, the ingredient name, and a
 *  chevron, per the premium / Apple Health-style direction. */
function renderPantryRow(
  ing: Ingredient,
  variant: PantryRowVariant,
  onToggle: (key: string) => void,
) {
  const isSelected = variant === 'selected';
  const a11yLabel = isSelected
    ? `${ing.name}, in pantry. Tap to remove.`
    : variant === 'missing'
      ? `${ing.name}, missing from pantry. Tap to add.`
      : `${ing.name}, recommended for this formula. Tap to add.`;
  return (
    <Pressable
      key={ing.id}
      onPress={() => onToggle(ing.id)}
      style={({ pressed }) => [
        styles.pantryRow,
        variant === 'selected' && styles.pantryRowSelected,
        variant === 'missing' && styles.pantryRowMissing,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={a11yLabel}
    >
      <View
        style={[
          styles.pantryRowIcon,
          isSelected && styles.pantryRowIconSelected,
        ]}
      >
        {isSelected ? (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        ) : (
          <Ionicons name="add" size={16} color={Colors.light.sageDeep} />
        )}
      </View>
      <Text style={styles.pantryRowLabel}>{ing.name}</Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={Colors.light.textSubtle}
      />
    </Pressable>
  );
}

export default function Preferences() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  // Subscribe so curated/Supabase recipes that arrive after first paint
  // re-render this screen (otherwise the ingredient list falls back to
  // bathroom-cleaner until the user pops + re-enters).
  useAllRecipes();
  const product = findProduct(id);
  const recipe = findRecipe(id);
  const { currency } = useCurrency();
  const pantry = usePantry();

  const [selected, setSelected] = useState<string[]>(['baby-safe', 'pet-safe']);
  const [strength, setStrength] = useState<'gentle' | 'balanced' | 'strong'>('balanced');

  // Smart three-section split:
  //   inPantry    — recipe ingredients the user already has
  //   recommended — catalog items matching the recipe's intent tags (mold,
  //                 wood, baby, etc.) the user could add for a better result
  //   missing     — recipe ingredients the user is missing
  // Strength toggle biases `recommended` toward / away from strengthBoost
  // ingredients so the suggestions feel responsive to the segmented control
  // above. Memoised so we don't re-score on every unrelated re-render.
  const { inPantry, recommended, missing } = useMemo(
    () => recommendForRecipe({ recipe, pantry, strength }),
    [recipe, pantry, strength],
  );
  const pantryTotalForRecipe = inPantry.length;

  const toggle = (set: string[], setSet: (v: string[]) => void, key: string) => {
    setSet(set.includes(key) ? set.filter((k) => k !== key) : [...set, key]);
  };

  const togglePantryRow = (key: string) => {
    tapLight();
    // Spring-like easeInEaseOut for the move between Selected / Add More
    // sections. Snappy enough to feel responsive, long enough to read.
    LayoutAnimation.configureNext({
      duration: 240,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    void togglePantryItem(key);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topTitle}>Tailor it</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero-card layout: clean 50/50 split — image fills the left
            half, text sits on solid product.swatch on the right half.
            No gradient overlay; the boundary is a hard edge between
            the photo and the swatch. */}
        <View style={[styles.productCard, { backgroundColor: product.swatch }]}>
          <Image
            source={recipeHeroImage(product.id)}
            testID="pc-recipe-icon"
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productText}>
            <Text style={styles.productEyebrow}>You&apos;re making</Text>
            <Text style={styles.productTitle} numberOfLines={1}>
              {product.title}
            </Text>
            <Text style={styles.productMeta} numberOfLines={1}>
              {product.time} • save {formatMoney(product.savingsUsd, { currency })}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>How should we tailor it?</Text>
        <Text style={styles.sectionSub}>Pick anything that fits your home.</Text>
        <View style={styles.chips}>
          {PREFS.map((p) => {
            const isSelected = selected.includes(p.key);
            return (
              <Pressable
                key={p.key}
                onPress={() => toggle(selected, setSelected, p.key)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons
                  name={p.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : Colors.light.sageDeep}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Strength</Text>
        <Text style={styles.sectionSub}>How strong should the formula be?</Text>
        <View style={styles.strength}>
          {(['gentle', 'balanced', 'strong'] as const).map((s) => {
            const isActive = strength === s;
            return (
              <Pressable
                key={s}
                onPress={() => setStrength(s)}
                style={({ pressed }) => [
                  styles.strengthCell,
                  isActive && styles.strengthCellActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.strengthLabel, isActive && styles.strengthLabelActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {inPantry.length + recommended.length + missing.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.sectionSub}>
              Tailored to this formula — tap to add or remove.
            </Text>

            {inPantry.length > 0 ? (
              <>
                <Text style={styles.pantryListLabel}>Your pantry</Text>
                <View style={styles.pantryList}>
                  {inPantry.map((ing) =>
                    renderPantryRow(ing, 'selected', togglePantryRow),
                  )}
                </View>
              </>
            ) : null}

            {recommended.length > 0 ? (
              <>
                <View
                  style={[
                    styles.pantryListLabelRow,
                    inPantry.length > 0 && { marginTop: Spacing.xl },
                  ]}
                >
                  <Text style={styles.pantryListLabel}>
                    Recommended for this formula
                  </Text>
                </View>
                <View style={styles.pantryList}>
                  {recommended.map((ing) =>
                    renderPantryRow(ing, 'recommended', togglePantryRow),
                  )}
                </View>
              </>
            ) : null}

            {missing.length > 0 ? (
              <>
                <Text
                  style={[
                    styles.pantryListLabel,
                    (inPantry.length > 0 || recommended.length > 0) && {
                      marginTop: Spacing.xl,
                    },
                  ]}
                >
                  Missing for best results
                </Text>
                <View style={styles.pantryList}>
                  {missing.map((ing) =>
                    renderPantryRow(ing, 'missing', togglePantryRow),
                  )}
                </View>
              </>
            ) : null}
          </>
        ) : null}

        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="sparkles" size={16} color={Colors.light.sageDeep} />
          </View>
          <Text style={styles.summaryText}>
            We&apos;ll mix {selected.length} preferences and {pantryTotalForRecipe} pantry items into your formula.
          </Text>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Generate formula"
          trailingIcon="sparkles"
          onPress={() => router.push({ pathname: '/loading', params: { id: product.id } })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { ...Type.bodyStrong, color: Colors.light.text },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  productCard: {
    height: 120,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    // backgroundColor is applied inline with product.swatch so each
    // recipe keeps its themed color and the gradient terminus matches.
  },
  productImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    // Image takes the left 40% of the card (shrunk from 50%) so the
    // recipe title gets more horizontal breathing room on the right.
    width: '40%',
    height: '100%',
  },
  productText: {
    position: 'absolute',
    // Text starts at x:40% (the image's right edge). 60% of the card
    // width minus paddings gives the headline ~176pt of room — long
    // titles like "Stainless Steel Spray" sit on one line at 18pt.
    left: '40%',
    paddingLeft: 16,
    right: 18,
    top: 16,
    bottom: 16,
    justifyContent: 'center',
  },
  productEyebrow: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: Colors.light.sageDeep,
    textTransform: 'uppercase',
  },
  productTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.3,
    marginTop: 6,
  },
  productMeta: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  sectionTitle: { ...Type.sectionTitle, color: Colors.light.text, marginTop: Spacing.xxl },
  sectionSub: { ...Type.caption, color: Colors.light.textMuted, marginTop: 4, marginBottom: Spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipSelected: { backgroundColor: Colors.light.sageDeep, borderColor: Colors.light.sageDeep },
  chipText: { ...Type.caption, color: Colors.light.text },
  chipTextSelected: { color: '#FFFFFF' },
  strength: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  strengthCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  strengthCellActive: {
    backgroundColor: '#FFFFFF',
    ...Shadow.card,
  },
  strengthLabel: { ...Type.caption, color: Colors.light.textMuted },
  strengthLabelActive: { color: Colors.light.text, fontWeight: '600' },
  // Premium list-based pantry UI — replaced the old 3-column emoji grid.
  // Design language reference: Apple Health row cells, Notion blocks.
  // Text-only (no emoji/images), generous padding, subtle borders, and
  // section labels small + uppercase for scanability.
  pantryListLabel: {
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: Colors.light.textMuted,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pantryListLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  pantryList: {
    gap: 8,
  },
  pantryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 60,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pantryRowSelected: {
    backgroundColor: Colors.light.sageSoft,
    borderColor: Colors.light.sage,
  },
  // Warm-cream tint on the Missing section so it reads as "you'll want
  // this" without using a louder accent. Same row geometry, just a
  // subtle background shift to differentiate from Recommended.
  pantryRowMissing: {
    backgroundColor: Colors.light.cream,
    borderColor: Colors.light.creamDeep,
  },
  pantryRowIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pantryRowIconSelected: {
    backgroundColor: Colors.light.sageDeep,
    borderColor: Colors.light.sageDeep,
  },
  pantryRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.light.cream,
    borderRadius: Radius.lg,
    marginTop: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { ...Type.caption, color: Colors.light.text, flex: 1, lineHeight: 18 },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
});

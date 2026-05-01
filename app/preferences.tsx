import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { formatMoney, useCurrency } from '@/constants/currency';
import { findProduct } from '@/constants/products';
import { recipeHeroImage } from '@/constants/recipeHeroImages';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

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

const PANTRY = [
  { key: 'water', label: 'Distilled water', emoji: '💧' },
  { key: 'vinegar', label: 'White vinegar', emoji: '🧴' },
  { key: 'baking-soda', label: 'Baking soda', emoji: '🧂' },
  { key: 'castile', label: 'Castile soap', emoji: '🫧' },
  { key: 'lemon', label: 'Lemon', emoji: '🍋' },
  { key: 'tea-tree', label: 'Tea tree oil', emoji: '🌱' },
  { key: 'lavender', label: 'Lavender oil', emoji: '🪻' },
];

export default function Preferences() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const product = findProduct(id);
  const { currency } = useCurrency();

  const [selected, setSelected] = useState<string[]>(['baby-safe', 'pet-safe']);
  const [pantry, setPantry] = useState<string[]>(['water', 'vinegar', 'baking-soda']);
  const [strength, setStrength] = useState<'gentle' | 'balanced' | 'strong'>('balanced');

  const toggle = (set: string[], setSet: (v: string[]) => void, key: string) => {
    setSet(set.includes(key) ? set.filter((k) => k !== key) : [...set, key]);
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
        {/* Premium hero-card layout — mirrors saved.tsx's ContinueMakingCard.
            Image bleeds the left ~65% of the card; LinearGradient fades it
            into product.swatch (the per-recipe themed color) so the seam is
            invisible regardless of which recipe is shown. Text sits on the
            right over the fade. */}
        <View style={[styles.productCard, { backgroundColor: product.swatch }]}>
          <Image
            source={recipeHeroImage(product.id)}
            testID="pc-recipe-icon"
            style={styles.productImage}
            resizeMode="cover"
          />
          {/* Tight transition: transparent at x:0.35 (image still clean),
              fully opaque swatch by x:0.55 — that's where the title's
              left edge sits, so the headline reads on solid color
              instead of bleeding into the photo. */}
          <LinearGradient
            colors={['transparent', product.swatch]}
            start={{ x: 0.35, y: 0 }}
            end={{ x: 0.55, y: 0 }}
            style={styles.productGradient}
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

        <Text style={styles.sectionTitle}>Ingredients I already have</Text>
        <Text style={styles.sectionSub}>We&apos;ll prefer these so you can make it now.</Text>
        <View style={styles.pantryGrid}>
          {PANTRY.map((p) => {
            const isSelected = pantry.includes(p.key);
            return (
              <Pressable
                key={p.key}
                onPress={() => toggle(pantry, setPantry, p.key)}
                style={({ pressed }) => [
                  styles.pantryCell,
                  isSelected && styles.pantryCellSelected,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.pantryEmoji}>{p.emoji}</Text>
                <Text style={styles.pantryLabel}>{p.label}</Text>
                <View style={[styles.pantryCheck, isSelected && styles.pantryCheckSelected]}>
                  {isSelected ? <Ionicons name="checkmark" size={11} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="sparkles" size={16} color={Colors.light.sageDeep} />
          </View>
          <Text style={styles.summaryText}>
            We&apos;ll mix {selected.length} preferences and {pantry.length} pantry items into your formula.
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
    // Mirrors saved.tsx ContinueMakingCard: image bleeds 65% of the
    // card width; the gradient and text positions below assume this.
    width: '65%',
    height: '100%',
  },
  productGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  productText: {
    position: 'absolute',
    // Text starts at x:55% (just past the gradient's opaque point) so
    // the title's first letter sits on solid swatch, never on the
    // photo. Tweak in pair with the gradient end above.
    left: '55%',
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
  pantryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  pantryCell: {
    width: '31.5%',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 100,
    justifyContent: 'center',
    position: 'relative',
  },
  pantryCellSelected: {
    backgroundColor: Colors.light.sageSoft,
    borderColor: Colors.light.sage,
  },
  pantryEmoji: { fontSize: 26 },
  pantryLabel: { ...Type.caption, color: Colors.light.text, marginTop: 6, textAlign: 'center' },
  pantryCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pantryCheckSelected: {
    backgroundColor: Colors.light.sageDeep,
    borderColor: Colors.light.sageDeep,
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

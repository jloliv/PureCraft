import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { formatMoney, useCurrency } from '@/constants/currency';
import { findProduct, findRecipe } from '@/constants/products';
import { computeSavings, formatRange } from '@/constants/savings';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

export default function Result() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const product = findProduct(id);
  const recipe = findRecipe(id);
  const { currency } = useCurrency();
  const [saved, setSaved] = useState(false);
  const savings = computeSavings(product.id);
  const retailLabel = `${formatRange(savings.retailLowUsd, savings.retailHighUsd, { currency })} at the store`;
  const savingsValue = savings.isEstimate
    ? formatRange(savings.savingsLowUsd, savings.savingsHighUsd, { currency, round: true })
    : formatMoney(savings.savingsMidUsd, { currency });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.replace('/')}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="close" size={20} color={Colors.light.text} />
        </Pressable>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share"
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            onPress={() => {}}
          >
            <Ionicons name="share-outline" size={18} color={Colors.light.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Saved' : 'Save'}
            style={({ pressed }) => [
              styles.iconBtn,
              saved && styles.iconBtnActive,
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => setSaved((s) => !s)}
          >
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={18}
              color={saved ? '#FFFFFF' : Colors.light.text}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: product.swatch }]}>
          <Text style={styles.heroEmoji}>{product.emoji}</Text>
          <Text style={styles.heroTitle}>{recipe.title}</Text>
          <Text style={styles.heroBlurb}>{recipe.blurb}</Text>
          <View style={styles.heroTags}>
            {product.tags.map((t) => (
              <View key={t} style={styles.heroTag}>
                <Text style={styles.heroTagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Time" value={product.time} icon="time-outline" />
          <Stat label="Ingredients" value={`${recipe.ingredients.length}`} icon="leaf-outline" />
          <Stat label="You save" value={savingsValue} icon="cash-outline" highlight />
        </View>

        {savings.bottlesAvoided > 0 ? (
          <View style={styles.impactRow}>
            <Ionicons name="leaf-outline" size={14} color={Colors.light.sageDeep} />
            <Text style={styles.impactText}>
              {savings.bottlesAvoided === 1
                ? '1 plastic bottle avoided'
                : `${savings.bottlesAvoided} plastic bottles avoided`}
              {' · '}
              <Text style={styles.impactSubtle}>vs {savings.retailLabel}</Text>
            </Text>
          </View>
        ) : null}

        <Section title="Ingredients" caption={`vs ${retailLabel}`}>
          <View style={styles.ingredientList}>
            {recipe.ingredients.map((ing, i) => (
              <View key={ing.name} style={[styles.ingredientRow, i === 0 && { borderTopWidth: 0 }]}>
                <View style={[styles.ingDot, ing.haveIt && styles.ingDotHave]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <Text style={styles.ingMeta}>{ing.amount}{ing.haveIt ? ' · in your pantry' : ''}</Text>
                </View>
                {ing.storePriceUsd != null ? (
                  <Text style={styles.ingPrice}>{formatMoney(ing.storePriceUsd, { currency })}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </Section>

        <Section title="Steps" caption={`${recipe.steps.length} simple steps`}>
          <View style={styles.steps}>
            {recipe.steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Stay safe" caption="Read before you mix">
          <View style={styles.warningCard}>
            {recipe.warnings.map((w, i) => (
              <View key={i} style={styles.warningRow}>
                <Ionicons name="alert-circle" size={16} color={Colors.light.danger} />
                <Text style={styles.warningText}>{w}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Smart swaps" caption="If you're missing something">
          <View style={styles.subsList}>
            {recipe.substitutions.map((s, i) => (
              <View key={i} style={styles.subRow}>
                <Text style={styles.subSwap}>{s.swap}</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.light.textSubtle} />
                <Text style={styles.subFor}>{s.for}</Text>
              </View>
            ))}
          </View>
        </Section>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <Pressable
            style={({ pressed }) => [styles.smallAction, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/categories')}
          >
            <Ionicons name="refresh" size={18} color={Colors.light.text} />
            <Text style={styles.smallActionText}>Make another</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Shopping list"
              leadingIcon="cart-outline"
              onPress={() => router.push({ pathname: '/shopping-list', params: { id: product.id } })}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.stat, highlight && styles.statHighlight]}>
      <View style={[styles.statIcon, highlight && styles.statIconHighlight]}>
        <Ionicons name={icon} size={14} color={highlight ? '#FFFFFF' : Colors.light.sageDeep} />
      </View>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={[styles.statLabel, highlight && styles.statLabelHighlight]}>{label}</Text>
    </View>
  );
}

function Section({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {children}
    </View>
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
  topActions: { flexDirection: 'row', gap: Spacing.sm },
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
  iconBtnActive: { backgroundColor: Colors.light.sageDeep, borderColor: Colors.light.sageDeep },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.card,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: { ...Type.hero, color: Colors.light.text, marginTop: Spacing.md, textAlign: 'center' },
  heroBlurb: { ...Type.body, color: Colors.light.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
  heroTags: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  heroTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFFCC',
  },
  heroTagText: { ...Type.caption, color: Colors.light.text },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  stat: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statHighlight: { backgroundColor: Colors.light.sageDeep, borderColor: Colors.light.sageDeep },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconHighlight: { backgroundColor: '#FFFFFF22' },
  statValue: { ...Type.bodyStrong, color: Colors.light.text },
  statValueHighlight: { color: '#FFFFFF' },
  statLabel: { ...Type.caption, color: Colors.light.textMuted },
  statLabelHighlight: { color: '#FFFFFFC0' },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    borderWidth: 1,
    borderColor: Colors.light.sage,
    alignSelf: 'flex-start',
  },
  impactText: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    fontWeight: '600',
  },
  impactSubtle: {
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  section: { marginTop: Spacing.xxl },
  sectionHeader: { marginBottom: Spacing.md },
  sectionTitle: { ...Type.sectionTitle, color: Colors.light.text },
  sectionCaption: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  ingredientList: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  ingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.textSubtle,
  },
  ingDotHave: { backgroundColor: Colors.light.sage },
  ingName: { ...Type.bodyStrong, color: Colors.light.text },
  ingMeta: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  ingPrice: { ...Type.caption, color: Colors.light.textMuted },
  steps: { gap: Spacing.md },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { ...Type.caption, color: '#FFFFFF', fontWeight: '700' },
  stepText: { ...Type.body, color: Colors.light.text, flex: 1, lineHeight: 22 },
  warningCard: {
    backgroundColor: '#FBEFEC',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#F1D9D2',
  },
  warningRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  warningText: { ...Type.caption, color: '#7A3B2C', flex: 1, lineHeight: 18 },
  subsList: {
    backgroundColor: Colors.light.cream,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  subSwap: { ...Type.bodyStrong, color: Colors.light.text },
  subFor: { ...Type.body, color: Colors.light.textMuted, flex: 1 },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  smallActionText: { ...Type.caption, color: Colors.light.text },
});

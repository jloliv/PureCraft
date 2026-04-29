import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding-header';
import { PrimaryButton } from '@/components/primary-button';
import { BACKGROUND_PRIMARY } from '@/constants/theme';
import { patchOnboardingAnswers } from '@/lib/onboarding-answers';
import { formatMoney, getCurrency } from '@/constants/currency';
import { setRegion } from '@/constants/region';
import { computeSavings } from '@/constants/savings';
import { tapLight } from '@/lib/haptics';

const PALETTE = {
  bg: BACKGROUND_PRIMARY,
  text: '#1F2420',
  textMuted: '#6B6B6B',
  textSubtle: '#8A8A8A',
  surface: 'rgba(255,255,255,0.5)',
  border: 'rgba(0,0,0,0.06)',
  sage: '#A8B8A0',
  sageDeep: '#5F876A',
  sageSoft: '#E8F0E9',
  cream: 'rgba(255,255,255,0.5)',
  creamDeep: 'rgba(0,0,0,0.06)',
};

type Store = {
  key: string;
  name: string;
  category: string;
};

const STORES: Store[] = [
  { key: 'walmart', name: 'Walmart', category: 'Value' },
  { key: 'target', name: 'Target', category: 'General Retail' },
  { key: 'trader-joes', name: 'Trader Joe’s', category: 'Natural Grocery' },
  { key: 'whole-foods', name: 'Whole Foods', category: 'Organic Market' },
  { key: 'costco', name: 'Costco', category: 'Bulk Savings' },
  { key: 'kroger', name: 'Kroger', category: 'Grocery' },
  { key: 'aldi', name: 'Aldi', category: 'Value' },
  { key: 'safeway', name: 'Safeway', category: 'Grocery' },
  { key: 'publix', name: 'Publix', category: 'Grocery' },
  { key: 'amazon', name: 'Amazon', category: 'Online' },
  { key: 'dollar-tree', name: 'Dollar Tree', category: 'Budget' },
];

// Recipes shown in the live-preview card. Mid-tier savings examples that
// communicate the value proposition without overpromising.
const PREVIEW_RECIPES = ['bathroom-cleaner', 'sugar-scrub', 'laundry-booster'] as const;
const RECIPE_LABEL: Record<string, string> = {
  'bathroom-cleaner': 'Bathroom cleaner',
  'sugar-scrub': 'Sugar scrub',
  'laundry-booster': 'Laundry powder',
};

export default function StoresStep() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) => {
    tapLight();
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const previewLines = useMemo(() => {
    if (!selected.length) return [];
    const currency = getCurrency('USD');
    return PREVIEW_RECIPES.map((id) => {
      const s = computeSavings(id);
      return {
        label: RECIPE_LABEL[id] ?? id,
        amount: formatMoney(s.savingsMidUsd, { currency, round: true }),
      };
    });
  }, [selected]);

  const previewSubtitle = useMemo(() => {
    if (!selected.length) return '';
    const names = selected
      .map((k) => STORES.find((s) => s.key === k)?.name)
      .filter(Boolean) as string[];
    if (names.length === 1) return `Based on ${names[0]}`;
    if (names.length === 2) return `Based on ${names[0]} + ${names[1]}`;
    return `Based on ${names[0]} + ${names.length - 1} more`;
  }, [selected]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={1} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 1 · Stores</Text>
        <Text style={styles.headline}>
          Where do you{`\n`}shop most often?
        </Text>
        <Text style={styles.sub}>
          We&apos;ll personalize ingredient prices and savings using your favorite stores.
        </Text>

        <View style={styles.grid}>
          {STORES.map((s) => {
            const isSelected = selected.includes(s.key);
            return (
              <Pressable
                key={s.key}
                onPress={() => toggle(s.key)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && { transform: [{ scale: 0.99 }] },
                ]}
              >
                <Text
                  style={[
                    styles.cardName,
                    isSelected && styles.cardNameSelected,
                    { flex: 1 },
                  ]}
                  numberOfLines={1}
                >
                  {s.name}
                </Text>
                {isSelected ? (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={styles.uncheck} />
                )}
              </Pressable>
            );
          })}
        </View>

        {previewLines.length > 0 ? (
          <View style={styles.preview}>
            <View style={styles.previewBadge}>
              <View style={styles.previewPulse} />
              <Text style={styles.previewBadgeText}>Live preview</Text>
            </View>
            <Text style={styles.previewTitle}>Estimated savings preview</Text>
            <Text style={styles.previewSub}>{previewSubtitle}</Text>

            <View style={styles.previewList}>
              {previewLines.map((p) => (
                <View key={p.label} style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{p.label}</Text>
                  <View style={styles.previewDot} />
                  <Text style={styles.previewAmount}>Save {p.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={selected.length ? 'Continue' : 'Pick at least one store'}
          trailingIcon={selected.length ? 'arrow-forward' : undefined}
          disabled={!selected.length}
          onPress={() => {
            // US-only launch — anchor pricing/currency to USA.
            setRegion('USA');
            void patchOnboardingAnswers({ region: 'USA' });
            router.push('/onboarding/intent');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 22, paddingBottom: 28, backgroundColor: PALETTE.bg },

  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.6,
    marginTop: 8,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.textMuted,
    marginTop: 10,
    marginBottom: 22,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48.5%',
    minHeight: 64,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardSelected: {
    backgroundColor: PALETTE.sageSoft,
    borderColor: PALETTE.sage,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.2,
  },
  cardNameSelected: {
    color: PALETTE.sageDeep,
  },
  cardCategory: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheck: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
  },

  preview: {
    marginTop: 22,
    padding: 18,
    borderRadius: 22,
    backgroundColor: PALETTE.cream,
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  previewPulse: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  previewBadgeText: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  previewTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  previewSub: {
    fontSize: 12.5,
    color: PALETTE.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  previewList: { marginTop: 12, gap: 8 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewLabel: {
    fontSize: 13,
    color: PALETTE.text,
    fontWeight: '500',
  },
  previewDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: PALETTE.textSubtle,
  },
  previewAmount: {
    fontSize: 13,
    color: PALETTE.sageDeep,
    fontWeight: '700',
  },

  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    backgroundColor: PALETTE.bg,
  },
});

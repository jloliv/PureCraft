import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding-header';
import { PrimaryButton } from '@/components/primary-button';
import { formatMoney, getCurrency } from '@/constants/currency';
import { REGIONS, type RegionCode, setRegion } from '@/constants/region';
import { computeSavings, formatRange } from '@/constants/savings';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#1F1F1F',
  textMuted: '#6F6A60',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  goldDeep: '#A98A4D',
};

export default function RegionStep() {
  const [selected, setSelected] = useState<RegionCode | null>(null);

  const previewSavings = useMemo(() => {
    if (!selected) return null;
    const region = REGIONS.find((r) => r.code === selected)!;
    const sample = computeSavings('bathroom-cleaner', region);
    const currency = { ...getCurrency(region.currency) };
    return {
      label: region.shortName,
      currency,
      range: formatRange(sample.savingsLowUsd, sample.savingsHighUsd, {
        currency,
        round: true,
      }),
      example: `Estimated savings on a ${formatMoney(sample.retailMidUsd, { currency })} bathroom spray`,
    };
  }, [selected]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={1} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 1 · Region</Text>
        <Text style={styles.headline}>Where do you{`\n`}shop most often?</Text>
        <Text style={styles.sub}>
          We tune ingredient prices and retail comparisons to your local stores — not just a currency
          conversion.
        </Text>

        <View style={styles.list}>
          {REGIONS.map((r) => {
            const isSelected = selected === r.code;
            return (
              <Pressable
                key={r.code}
                onPress={() => setSelected(r.code)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && { transform: [{ scale: 0.99 }] },
                ]}
              >
                <Text style={styles.flag}>{r.flag}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{r.name}</Text>
                    <View
                      style={[
                        styles.currencyChip,
                        isSelected && { backgroundColor: PALETTE.sageDeep, borderColor: PALETTE.sageDeep },
                      ]}
                    >
                      <Text style={[styles.currencyText, isSelected && { color: '#FFFFFF' }]}>
                        {r.currency}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardSub}>{r.storeExamples}</Text>
                </View>
                {isSelected ? (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={styles.uncheck} />
                )}
              </Pressable>
            );
          })}
        </View>

        {previewSavings ? (
          <View style={styles.preview}>
            <View style={styles.previewBadge}>
              <View style={styles.previewPulse} />
              <Text style={styles.previewBadgeText}>Live preview · {previewSavings.label}</Text>
            </View>
            <Text style={styles.previewTitle}>
              Estimated savings in your region: {previewSavings.range}
            </Text>
            <Text style={styles.previewSub}>{previewSavings.example}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={selected ? 'Continue' : 'Pick a region'}
          trailingIcon={selected ? 'arrow-forward' : undefined}
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setRegion(selected);
            router.push('/onboarding/intent');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 22, paddingBottom: 24 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: '600',
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
    marginBottom: 24,
  },
  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  cardSelected: {
    backgroundColor: PALETTE.sageSoft,
    borderColor: PALETTE.sage,
  },
  flag: { fontSize: 28 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: PALETTE.text, letterSpacing: -0.2 },
  currencyChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FFFFFFE6',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  currencyText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: 0.6,
  },
  cardSub: { fontSize: 12, color: PALETTE.textMuted, lineHeight: 16 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheck: {
    width: 26,
    height: 26,
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
    gap: 6,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFFCC',
    marginBottom: 4,
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
  previewSub: { fontSize: 12.5, color: PALETTE.textMuted },

  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    backgroundColor: PALETTE.bg,
  },
});

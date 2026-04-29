import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding-header';
import { PrimaryButton } from '@/components/primary-button';
import { BACKGROUND_PRIMARY } from '@/constants/theme';
import { patchOnboardingAnswers } from '@/lib/onboarding-answers';

const PALETTE = {
  bg: BACKGROUND_PRIMARY,
  text: '#1F1F1F',
  textMuted: '#6B6B6B',
  textSubtle: '#8A8A8A',
  surface: 'rgba(255,255,255,0.5)',
  border: 'rgba(0,0,0,0.06)',
  sage: '#A8B8A0',
  sageDeep: '#5F876A',
  sageSoft: '#E4EDE5',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
};

const MAX_PICKS = 3;

type Priority = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap };

const PRIORITIES: Priority[] = [
  { key: 'safety', label: 'Safety', icon: 'shield-checkmark-outline' },
  { key: 'budget', label: 'Budget', icon: 'cash-outline' },
  { key: 'luxury', label: 'Luxury Feel', icon: 'sparkles-outline' },
  { key: 'results', label: 'Strong Results', icon: 'flash-outline' },
  { key: 'natural', label: 'Natural', icon: 'leaf-outline' },
  { key: 'fast', label: 'Fast Recipes', icon: 'time-outline' },
  { key: 'sustain', label: 'Sustainability', icon: 'refresh-outline' },
  { key: 'skin-friendly', label: 'Skin Friendly', icon: 'flower-outline' },
];

export default function Priorities() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_PICKS) return prev;
      return [...prev, key];
    });
  };

  const remaining = MAX_PICKS - selected.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={6} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 6</Text>
        <Text style={styles.headline}>Pick your top 3.</Text>
        <Text style={styles.sub}>
          The non-negotiables. We&apos;ll rank every recipe by these.
        </Text>

        <View style={styles.counter}>
          <View style={styles.counterDots}>
            {Array.from({ length: MAX_PICKS }).map((_, i) => (
              <View
                key={i}
                style={[styles.counterDot, i < selected.length && styles.counterDotFilled]}
              />
            ))}
          </View>
          <Text style={styles.counterLabel}>
            {selected.length === MAX_PICKS
              ? 'All set'
              : remaining === MAX_PICKS
                ? `Pick ${MAX_PICKS}`
                : `${remaining} more to go`}
          </Text>
        </View>

        <View style={styles.grid}>
          {PRIORITIES.map((p) => {
            const isSelected = selected.includes(p.key);
            const rank = isSelected ? selected.indexOf(p.key) + 1 : null;
            const disabled = !isSelected && selected.length >= MAX_PICKS;
            return (
              <Pressable
                key={p.key}
                onPress={() => toggle(p.key)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  disabled && { opacity: 0.4 },
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Ionicons
                    name={p.icon}
                    size={20}
                    color={isSelected ? '#FFFFFF' : PALETTE.sageDeep}
                  />
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {p.label}
                </Text>
                {rank ? (
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{rank}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={selected.length === MAX_PICKS ? 'Continue' : `Pick ${remaining} more`}
          trailingIcon={selected.length === MAX_PICKS ? 'arrow-forward' : undefined}
          disabled={selected.length < MAX_PICKS}
          onPress={() => router.push('/onboarding/routine')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 22, paddingBottom: 24, backgroundColor: PALETTE.bg },
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
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    marginBottom: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  counterDots: { flexDirection: 'row', gap: 6 },
  counterDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
  },
  counterDotFilled: {
    backgroundColor: PALETTE.sageDeep,
    borderColor: PALETTE.sageDeep,
  },
  counterLabel: { fontSize: 13, fontWeight: '600', color: PALETTE.text },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '31%',
    minHeight: 112,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 22,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: PALETTE.sageSoft,
    borderColor: PALETTE.sage,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: PALETTE.sageDeep },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.2,
    lineHeight: 17,
    textAlign: 'center',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: PALETTE.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 10.5, fontWeight: '700', color: '#FFFFFF' },

  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    backgroundColor: PALETTE.bg,
  },
});

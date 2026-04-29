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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={6} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 6</Text>
        <Text style={styles.headline}>Pick your top 3.</Text>
        <Text style={styles.sub}>
          The non-negotiables. We&apos;ll rank every recipe by these.
        </Text>
        <Text style={styles.selectHint}>Choose up to 3</Text>

        <View style={styles.grid}>
          {PRIORITIES.map((p) => {
            const isSelected = selected.includes(p.key);
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
                <View style={styles.iconWrap}>
                  <Ionicons name={p.icon} size={26} color={PALETTE.sageDeep} />
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {p.label}
                </Text>
                {isSelected ? (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={22} color={PALETTE.sageDeep} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
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
    fontSize: 26,
    lineHeight: 30,
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
  selectHint: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSubtle,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 18,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#F6F1E8',
    borderWidth: 1,
    borderColor: '#E6DFD2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  cardSelected: {
    borderColor: PALETTE.sageDeep,
    backgroundColor: 'rgba(95,135,106,0.08)',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(95,135,106,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2F4F3E',
  },
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
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

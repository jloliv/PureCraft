import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding-header';
import { BACKGROUND_PRIMARY } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';
import { patchOnboardingAnswers } from '@/lib/onboarding-answers';

const PALETTE = {
  bg: BACKGROUND_PRIMARY,
  text: '#1F1F1F',
  textMuted: '#6B6B6B',
  textSubtle: '#7A8A7A',
  sageDeep: '#5F876A',
};

type Concern = { key: string; label: string };

const CONCERNS: Concern[] = [
  { key: 'sensitive', label: 'Sensitive Skin' },
  { key: 'dry', label: 'Dry Skin' },
  { key: 'oily', label: 'Oily Skin' },
  { key: 'acne', label: 'Acne Prone' },
  { key: 'eczema', label: 'Eczema Prone' },
  { key: 'mature', label: 'Mature Skin' },
  { key: 'scalp', label: 'Scalp Issues' },
];

export default function Skin() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) => {
    tapLight();
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const saveAndContinue = () => {
    void patchOnboardingAnswers({ skin_profile: { concerns: selected } });
    router.push('/onboarding/scent');
  };

  const hasSelections = selected.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={3} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 3</Text>
        <Text style={styles.headline}>How does your skin behave?</Text>
        <Text style={styles.sub}>
          Beauty recipes get tailored ingredients, gentler ratios, and smarter swaps.
        </Text>
        <Text style={styles.instruction}>Select all that apply.</Text>

        <View style={styles.chipWrap}>
          {CONCERNS.map((concern) => {
            const isSelected = selected.includes(concern.key);
            return (
              <Pressable
                key={concern.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={concern.label}
                onPress={() => toggle(concern.key)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {concern.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={saveAndContinue}
          style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.99 }] }]}
        >
          <Text style={styles.ctaText}>{hasSelections ? 'Continue' : 'Skip for now'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 22, paddingBottom: 32, backgroundColor: PALETTE.bg },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: '600',
    color: PALETTE.textSubtle,
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
  instruction: {
    fontSize: 13,
    color: PALETTE.textMuted,
    marginTop: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2EDE3',
    borderWidth: 1,
    borderColor: '#E6DFD2',
  },
  chipSelected: {
    backgroundColor: PALETTE.sageDeep,
    borderColor: PALETTE.sageDeep,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2F4F3E',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: PALETTE.bg,
    alignItems: 'center',
  },
  cta: {
    width: '90%',
    height: 56,
    borderRadius: 18,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

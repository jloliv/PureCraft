import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding-header';
import { PrimaryButton } from '@/components/primary-button';
import { BACKGROUND_PRIMARY } from '@/constants/theme';
import { patchOnboardingAnswers, useOnboardingAnswers } from '@/lib/onboarding-answers';

const PALETTE = {
  bg: BACKGROUND_PRIMARY,
  text: '#1F1F1F',
  textMuted: '#6B6B6B',
  sageDeep: '#5F876A',
};

type Member = {
  key: string;
  label: string;
};

const MEMBERS: Member[] = [
  { key: 'baby', label: 'Babies' },
  { key: 'young', label: 'Young Children' },
  { key: 'older', label: 'Older Children' },
  { key: 'teens', label: 'Teens' },
  { key: 'pets', label: 'Pets' },
  { key: 'adults', label: 'Just Adults' },
  { key: 'elderly', label: 'Elderly Family' },
];

export default function Household() {
  // Seed from previously-saved answers so re-entering from Settings shows
  // the user's existing picks instead of an empty state.
  const savedAnswers = useOnboardingAnswers();
  const [selected, setSelected] = useState<string[]>(
    () => savedAnswers.household ?? [],
  );

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={5} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 5</Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={styles.headline}
        >
          Who shares your home?
        </Text>
        <Text style={styles.sub}>
          We&apos;ll keep every formula safe for everyone under your roof.
        </Text>

        <View style={styles.chipWrap}>
          {MEMBERS.map((m) => {
            const isSelected = selected.includes(m.key);
            return (
              <Pressable
                key={m.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={m.label}
                onPress={() => toggle(m.key)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          trailingIcon="arrow-forward"
          onPress={() => {
            void patchOnboardingAnswers({ household: selected });
            router.push('/onboarding/priorities');
          }}
        />
        <Pressable
          hitSlop={8}
          onPress={() => {
            void patchOnboardingAnswers({ household: selected });
            router.push('/onboarding/priorities');
          }}
        >
          <Text style={styles.skip}>Skip for now</Text>
        </Pressable>
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
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -1.0,
    marginTop: 8,
    maxWidth: '96%',
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.textMuted,
    marginTop: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#F2EDE3',
    borderWidth: 1,
    borderColor: '#E6DFD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: PALETTE.sageDeep,
    borderColor: PALETTE.sageDeep,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F4F3E',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: PALETTE.bg,
    alignItems: 'center',
    gap: 6,
  },
  skip: {
    color: PALETTE.textMuted,
    fontSize: 13,
    paddingVertical: 6,
  },
});

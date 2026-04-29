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
  surface: 'rgba(255,255,255,0.5)',
  border: 'rgba(0,0,0,0.06)',
  sage: '#A8B8A0',
  sageDeep: '#5F876A',
  sageSoft: '#E4EDE5',
};

type Style = {
  key: string;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const STYLES: Style[] = [
  { key: 'quick', label: 'Quick & Easy Only', hint: 'Sub-5-minute formulas', icon: 'flash-outline' },
  { key: 'weekend', label: 'Weekend Projects', hint: 'I love a slow Sunday routine', icon: 'sunny-outline' },
  { key: 'love-making', label: 'I Enjoy Making Things', hint: 'Send me the artisan recipes', icon: 'color-wand-outline' },
  { key: 'surprise', label: 'Surprise Me', hint: 'Curate based on my profile', icon: 'sparkles-outline' },
  { key: 'minimal', label: 'Minimal Effort', hint: '2-ingredient or fewer wins', icon: 'leaf-outline' },
];

export default function Routine() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={7} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 7</Text>
        <Text style={styles.headline}>How do you like to make?</Text>
        <Text style={styles.sub}>Sets the rhythm of recommendations and recipe length.</Text>

        <View style={styles.list}>
          {STYLES.map((s) => {
            const isSelected = selected === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSelected(s.key)}
                style={({ pressed }) => [
                  styles.row,
                  isSelected && styles.rowSelected,
                  pressed && { transform: [{ scale: 0.99 }] },
                ]}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Ionicons
                    name={s.icon}
                    size={20}
                    color={isSelected ? '#FFFFFF' : PALETTE.sageDeep}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{s.label}</Text>
                  <Text style={styles.rowHint}>{s.hint}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={selected ? 'Continue' : 'Pick one'}
          trailingIcon={selected ? 'arrow-forward' : undefined}
          disabled={!selected}
          onPress={() => router.push('/onboarding/time')}
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
  sub: { fontSize: 14, lineHeight: 20, color: PALETTE.textMuted, marginTop: 10, marginBottom: 24 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: PALETTE.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  rowSelected: {
    backgroundColor: PALETTE.sageSoft,
    borderColor: PALETTE.sage,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  iconWrapSelected: {
    backgroundColor: PALETTE.sageDeep,
    borderColor: PALETTE.sageDeep,
  },
  rowLabel: { fontSize: 15, fontWeight: '700', color: PALETTE.text, letterSpacing: -0.2 },
  rowHint: { fontSize: 12.5, color: PALETTE.textMuted, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: PALETTE.sageDeep },
  radioDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: PALETTE.sageDeep },

  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    backgroundColor: PALETTE.bg,
  },
});

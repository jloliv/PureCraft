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

type Option = {
  key: string;
  label: string;
  hint: string;
  emoji: string;
};

const OPTIONS: Option[] = [
  { key: 'love-strong', label: 'Love strong scents', hint: 'Layered florals & spice', emoji: '🌹' },
  { key: 'light', label: 'Prefer light scents', hint: 'Subtle, like a soft breeze', emoji: '🌿' },
  { key: 'sensitive', label: 'Very scent sensitive', hint: 'Mild and rare only', emoji: '🌬️' },
  { key: 'unscented', label: 'Unscented only', hint: 'Pure and clinical', emoji: '🤍' },
];

export default function Scent() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={4} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 4</Text>
        <Text style={styles.headline}>How do you like{`\n`}things to smell?</Text>
        <Text style={styles.sub}>
          We tune fragrance load and oil concentration in every product.
        </Text>

        <View style={styles.list}>
          {OPTIONS.map((o) => {
            const isSelected = selected === o.key;
            return (
              <Pressable
                key={o.key}
                onPress={() => setSelected(o.key)}
                style={({ pressed }) => [
                  styles.row,
                  isSelected && styles.rowSelected,
                  pressed && { transform: [{ scale: 0.99 }] },
                ]}
              >
                <View style={[styles.emojiWrap, isSelected && styles.emojiWrapSelected]}>
                  <Text style={styles.emoji}>{o.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{o.label}</Text>
                  <Text style={styles.rowHint}>{o.hint}</Text>
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
          onPress={() => router.push('/onboarding/household')}
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
    marginBottom: 24,
  },
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: PALETTE.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  rowSelected: {
    backgroundColor: PALETTE.sageSoft,
    borderColor: PALETTE.sage,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  emojiWrapSelected: { backgroundColor: 'rgba(255,255,255,0.5)', borderColor: PALETTE.sage },
  emoji: { fontSize: 24 },
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

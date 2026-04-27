import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding-header';
import { PrimaryButton } from '@/components/primary-button';

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
};

type Avoidance = { key: string; label: string; emoji: string };

const AVOIDANCES: Avoidance[] = [
  { key: 'fragrance', label: 'Fragrance', emoji: '🌸' },
  { key: 'nuts', label: 'Nuts', emoji: '🥜' },
  { key: 'coconut', label: 'Coconut', emoji: '🥥' },
  { key: 'vinegar', label: 'Vinegar', emoji: '🍶' },
  { key: 'eo', label: 'Essential Oils', emoji: '🪻' },
  { key: 'baking-soda', label: 'Baking Soda', emoji: '🧂' },
  { key: 'gluten', label: 'Gluten', emoji: '🌾' },
  { key: 'chemical', label: 'Sensitive to chemicals', emoji: '🧪' },
];

const NONE_KEY = 'none';

export default function Avoidances() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) => {
    if (key === NONE_KEY) {
      setSelected((prev) => (prev.includes(NONE_KEY) ? [] : [NONE_KEY]));
      return;
    }
    setSelected((prev) => {
      const without = prev.filter((k) => k !== NONE_KEY);
      return without.includes(key) ? without.filter((k) => k !== key) : [...without, key];
    });
  };

  const noneSelected = selected.includes(NONE_KEY);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={2} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 2</Text>
        <Text style={styles.headline}>Anything you{`\n`}always avoid?</Text>
        <Text style={styles.sub}>
          We&apos;ll flag and substitute these in every recipe — automatically.
        </Text>

        <View style={styles.chips}>
          {AVOIDANCES.map((a) => {
            const isSelected = selected.includes(a.key);
            return (
              <Pressable
                key={a.key}
                onPress={() => toggle(a.key)}
                disabled={noneSelected}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  noneSelected && { opacity: 0.4 },
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.chipEmoji}>{a.emoji}</Text>
                <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                  {a.label}
                </Text>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => toggle(NONE_KEY)}
          style={({ pressed }) => [
            styles.noneBtn,
            noneSelected && styles.noneBtnSelected,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons
            name={noneSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={18}
            color={noneSelected ? '#FFFFFF' : PALETTE.sageDeep}
          />
          <Text style={[styles.noneText, noneSelected && { color: '#FFFFFF' }]}>
            None of the above
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          trailingIcon="arrow-forward"
          onPress={() => router.push('/onboarding/skin')}
        />
        <Pressable hitSlop={8} onPress={() => router.push('/onboarding/skin')}>
          <Text style={styles.skip}>Skip for now</Text>
        </Pressable>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipSelected: {
    backgroundColor: PALETTE.sageDeep,
    borderColor: PALETTE.sageDeep,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: PALETTE.text },
  chipLabelSelected: { color: '#FFFFFF' },

  noneBtn: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignSelf: 'flex-start',
  },
  noneBtnSelected: {
    backgroundColor: PALETTE.sageDeep,
    borderColor: PALETTE.sageDeep,
  },
  noneText: { fontSize: 14, fontWeight: '600', color: PALETTE.text },

  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    backgroundColor: PALETTE.bg,
    gap: 12,
    alignItems: 'center',
  },
  skip: { fontSize: 12.5, color: PALETTE.textMuted, fontWeight: '500' },
});

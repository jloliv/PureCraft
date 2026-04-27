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
  surface: '#FFFFFF',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
};

type Concern = { key: string; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap };

const CONCERNS: Concern[] = [
  { key: 'sensitive', label: 'Sensitive Skin', hint: 'Reacts easily', icon: 'flower-outline' },
  { key: 'dry', label: 'Dry Skin', hint: 'Tight, flaky', icon: 'water-outline' },
  { key: 'oily', label: 'Oily Skin', hint: 'Shine + breakouts', icon: 'sunny-outline' },
  { key: 'acne', label: 'Acne Prone', hint: 'Breakouts often', icon: 'thermometer-outline' },
  { key: 'eczema', label: 'Eczema Prone', hint: 'Redness + dry patches', icon: 'medkit-outline' },
  { key: 'mature', label: 'Mature Skin', hint: 'Lines + radiance', icon: 'star-outline' },
  { key: 'scalp', label: 'Scalp Issues', hint: 'Itch + flake', icon: 'leaf-outline' },
];

const NONE_KEY = 'none';

export default function Skin() {
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
      <OnboardingHeader step={3} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 3</Text>
        <Text style={styles.headline}>How does your{`\n`}skin behave?</Text>
        <Text style={styles.sub}>
          Beauty recipes get tailored ingredients, gentler ratios, and smarter swaps.
        </Text>

        <View style={styles.list}>
          {CONCERNS.map((c) => {
            const isSelected = selected.includes(c.key);
            return (
              <Pressable
                key={c.key}
                onPress={() => toggle(c.key)}
                disabled={noneSelected}
                style={({ pressed }) => [
                  styles.row,
                  isSelected && styles.rowSelected,
                  noneSelected && { opacity: 0.4 },
                  pressed && { transform: [{ scale: 0.99 }] },
                ]}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Ionicons
                    name={c.icon}
                    size={18}
                    color={isSelected ? '#FFFFFF' : PALETTE.sageDeep}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{c.label}</Text>
                  <Text style={styles.rowHint}>{c.hint}</Text>
                </View>
                <View style={[styles.check, isSelected && styles.checkSelected]}>
                  {isSelected ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => toggle(NONE_KEY)}
            style={({ pressed }) => [
              styles.row,
              noneSelected && styles.rowSelected,
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={[styles.iconWrap, noneSelected && styles.iconWrapSelected]}>
              <Ionicons
                name="happy-outline"
                size={18}
                color={noneSelected ? '#FFFFFF' : PALETTE.sageDeep}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>No concerns</Text>
              <Text style={styles.rowHint}>Skin is happy and stable</Text>
            </View>
            <View style={[styles.check, noneSelected && styles.checkSelected]}>
              {noneSelected ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          trailingIcon="arrow-forward"
          onPress={() => router.push('/onboarding/scent')}
        />
        <Pressable hitSlop={8} onPress={() => router.push('/onboarding/scent')}>
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
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  iconWrapSelected: {
    backgroundColor: PALETTE.sageDeep,
    borderColor: PALETTE.sageDeep,
  },
  rowLabel: { fontSize: 14.5, fontWeight: '600', color: PALETTE.text },
  rowHint: { fontSize: 12, color: PALETTE.textMuted, marginTop: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: PALETTE.sageDeep, borderColor: PALETTE.sageDeep },

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

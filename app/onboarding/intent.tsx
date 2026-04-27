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
  surfaceWarm: '#F1ECE0',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
};

type Intent = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap };

const INTENTS: Intent[] = [
  { key: 'safer-clean', label: 'Safer Cleaning', icon: 'sparkles-outline' },
  { key: 'skin-care', label: 'Better Skin Care', icon: 'flower-outline' },
  { key: 'home-scent', label: 'Luxury Home Scents', icon: 'rose-outline' },
  { key: 'save-money', label: 'Save Money', icon: 'cash-outline' },
  { key: 'allergy', label: 'Allergy Friendly', icon: 'medkit-outline' },
  { key: 'eco', label: 'Eco Living', icon: 'leaf-outline' },
  { key: 'beauty', label: 'DIY Beauty', icon: 'color-palette-outline' },
  { key: 'wellness', label: 'Wellness Rituals', icon: 'moon-outline' },
];

export default function Intent() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={1} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 1</Text>
        <Text style={styles.headline}>What brings you{`\n`}to PureCraft?</Text>
        <Text style={styles.sub}>Pick anything that sparks. We&apos;ll tune your feed around it.</Text>

        <View style={styles.grid}>
          {INTENTS.map((it) => {
            const isSelected = selected.includes(it.key);
            return (
              <Pressable
                key={it.key}
                onPress={() => toggle(it.key)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Ionicons
                    name={it.icon}
                    size={20}
                    color={isSelected ? '#FFFFFF' : PALETTE.sageDeep}
                  />
                </View>
                <Text style={styles.label}>{it.label}</Text>
                {isSelected ? (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={selected.length > 0 ? 'Continue' : 'Pick at least one'}
          trailingIcon={selected.length > 0 ? 'arrow-forward' : undefined}
          disabled={selected.length === 0}
          onPress={() => router.push('/onboarding/avoidances')}
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
    marginBottom: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    minHeight: 120,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    justifyContent: 'flex-start',
    gap: 14,
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: PALETTE.sageSoft,
    borderColor: PALETTE.sage,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: PALETTE.sageDeep,
  },
  label: { fontSize: 14, fontWeight: '600', color: PALETTE.text, lineHeight: 18 },
  check: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
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

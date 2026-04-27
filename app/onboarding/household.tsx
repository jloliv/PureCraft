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
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
};

type Member = { key: string; label: string; hint: string; emoji: string };

const MEMBERS: Member[] = [
  { key: 'baby', label: 'Babies', hint: '0 – 2', emoji: '👶' },
  { key: 'young', label: 'Young Children', hint: '3 – 7', emoji: '🧒' },
  { key: 'older', label: 'Older Children', hint: '8 – 12', emoji: '🎒' },
  { key: 'teens', label: 'Teens', hint: '13 – 17', emoji: '🧑' },
  { key: 'pets', label: 'Pets', hint: 'Cats, dogs & more', emoji: '🐾' },
  { key: 'adults', label: 'Adults Only', hint: 'No little ones', emoji: '🫖' },
  { key: 'elderly', label: 'Elderly Family', hint: 'Sensitive support', emoji: '🌷' },
];

export default function Household() {
  const [selected, setSelected] = useState<string[]>([]);

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

        <View style={styles.grid}>
          {MEMBERS.map((m) => {
            const isSelected = selected.includes(m.key);
            return (
              <Pressable
                key={m.key}
                onPress={() => toggle(m.key)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={[styles.emojiWrap, isSelected && styles.emojiWrapSelected]}>
                  <Text style={styles.emoji}>{m.emoji}</Text>
                </View>
                <Text style={styles.label}>{m.label}</Text>
                <Text style={styles.hint}>{m.hint}</Text>
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
          label="Continue"
          trailingIcon="arrow-forward"
          onPress={() => router.push('/onboarding/priorities')}
        />
        <Pressable hitSlop={8} onPress={() => router.push('/onboarding/priorities')}>
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
    fontSize: 36,
    lineHeight: 42,
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
    marginBottom: 24,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '31%',
    flexGrow: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    minHeight: 130,
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: PALETTE.sageSoft,
    borderColor: PALETTE.sage,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  emojiWrapSelected: { backgroundColor: '#FFFFFF', borderColor: PALETTE.sage },
  emoji: { fontSize: 22 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.text,
    marginTop: 10,
    textAlign: 'center',
  },
  hint: { fontSize: 11, color: PALETTE.textMuted, marginTop: 2, textAlign: 'center' },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
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
    gap: 12,
    alignItems: 'center',
  },
  skip: { fontSize: 12.5, color: PALETTE.textMuted, fontWeight: '500' },
});

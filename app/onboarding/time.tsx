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
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  gold: '#C7A96B',
};

const STEPS = [1, 5, 10, 15, 20, 25, 30] as const;

const VIBE: Record<number, { eyebrow: string; tagline: string; icon: keyof typeof Ionicons.glyphMap }> = {
  1: { eyebrow: 'Lightning', tagline: 'A splash and pour.', icon: 'flash-outline' },
  5: { eyebrow: 'Quick', tagline: 'Done before the kettle boils.', icon: 'time-outline' },
  10: { eyebrow: 'Easy', tagline: 'A song-length recipe.', icon: 'musical-notes-outline' },
  15: { eyebrow: 'Crafted', tagline: 'A tea ritual.', icon: 'cafe-outline' },
  20: { eyebrow: 'Indulgent', tagline: 'Slow Sunday energy.', icon: 'sunny-outline' },
  25: { eyebrow: 'Studio', tagline: 'Apothecary mode.', icon: 'flask-outline' },
  30: { eyebrow: 'Maker', tagline: 'Full artisan workshop.', icon: 'leaf-outline' },
};

export default function TimePref() {
  const [value, setValue] = useState<number>(10);

  const idx = STEPS.indexOf(value as (typeof STEPS)[number]);
  const fillPct = (idx / (STEPS.length - 1)) * 100;
  const vibe = VIBE[value];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingHeader step={8} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Step 8</Text>
        <Text style={styles.headline}>How long should{`\n`}recipes take?</Text>
        <Text style={styles.sub}>
          Drag or tap. We&apos;ll sort your feed by recipes that fit this window.
        </Text>

        <View style={styles.bigCard}>
          <View style={styles.vibeRow}>
            <View style={styles.vibeIconWrap}>
              <Ionicons name={vibe.icon} size={18} color={PALETTE.sageDeep} />
            </View>
            <Text style={styles.vibeEyebrow}>{vibe.eyebrow}</Text>
          </View>
          <Text style={styles.bigValue}>
            {value}
            <Text style={styles.bigUnit}> min</Text>
          </Text>
          <Text style={styles.tagline}>{vibe.tagline}</Text>
        </View>

        <View style={styles.sliderArea}>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${fillPct}%` }]} />
          </View>
          <View style={styles.tickRow}>
            {STEPS.map((s, i) => {
              const isSelected = value === s;
              const isPassed = i <= idx;
              return (
                <Pressable
                  key={s}
                  onPress={() => setValue(s)}
                  hitSlop={14}
                  style={styles.tickHit}
                >
                  <View
                    style={[
                      styles.tickDot,
                      isPassed && styles.tickDotPassed,
                      isSelected && styles.tickDotActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.tickLabel,
                      isSelected && styles.tickLabelActive,
                    ]}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.bookendRow}>
            <Text style={styles.bookend}>1 min</Text>
            <Text style={styles.bookend}>30 min</Text>
          </View>
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={14} color={PALETTE.textMuted} />
          <Text style={styles.noteText}>
            Optional — you can always change this anytime in Profile.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="See my profile"
          trailingIcon="sparkles"
          onPress={() => router.push('/onboarding/loading')}
        />
        <Pressable hitSlop={8} onPress={() => router.push('/onboarding/loading')}>
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
  sub: { fontSize: 14, lineHeight: 20, color: PALETTE.textMuted, marginTop: 10, marginBottom: 24 },

  bigCard: {
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderRadius: 24,
    backgroundColor: PALETTE.cream,
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  vibeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  vibeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vibeEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  bigValue: {
    fontSize: 64,
    lineHeight: 70,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -2,
  },
  bigUnit: {
    fontSize: 22,
    fontWeight: '500',
    color: PALETTE.textMuted,
    letterSpacing: -0.2,
  },
  tagline: { fontSize: 13, color: PALETTE.textMuted, fontStyle: 'italic' },

  sliderArea: { marginTop: 26, gap: 6 },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  trackFill: { height: '100%', backgroundColor: PALETTE.sageDeep },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -16,
    paddingHorizontal: 0,
  },
  tickHit: { alignItems: 'center', gap: 6, paddingVertical: 4 },
  tickDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
  },
  tickDotPassed: {
    backgroundColor: PALETTE.sage,
    borderColor: PALETTE.sage,
  },
  tickDotActive: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: PALETTE.sageDeep,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tickLabel: { fontSize: 11, color: PALETTE.textSubtle, fontWeight: '500' },
  tickLabelActive: { color: PALETTE.text, fontWeight: '700' },
  bookendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  bookend: { fontSize: 11, color: PALETTE.textSubtle, fontWeight: '500' },

  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    justifyContent: 'center',
  },
  noteText: { fontSize: 12, color: PALETTE.textMuted },

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

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

// Six outcome-focused priorities. Trimmed from eight after a UX
// review found "Luxury Feel" and "Natural" were too vague to drive
// good algorithm signal. Each remaining option corresponds to a
// concrete recipe-ranking lever:
//   safety       — gentle ingredient profile (general safe use)
//   budget       — cheaper recipes prioritized
//   results      — strongest cleaning / efficacy
//   fast         — shortest preparation time
//   eco-friendly — low-waste / refillable bias
//   allergy-free — irritant filtering (distinct from `safety` which
//                  is broader; allergy-free specifically excludes
//                  known irritants)
const PRIORITIES: Priority[] = [
  { key: 'safety', label: 'Safety', icon: 'shield-checkmark-outline' },
  { key: 'budget', label: 'Budget', icon: 'cash-outline' },
  { key: 'results', label: 'Strong Results', icon: 'flash-outline' },
  { key: 'fast', label: 'Fast', icon: 'time-outline' },
  { key: 'eco-friendly', label: 'Eco Friendly', icon: 'leaf-outline' },
  { key: 'allergy-free', label: 'Allergy-Free', icon: 'medkit-outline' },
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
        <Text style={styles.headline}>Pick up to 3 priorities.</Text>
        <Text style={styles.sub}>
          The non-negotiables. We&apos;ll rank every recipe by these.
        </Text>

        <View style={[styles.grid, styles.gridSpaceTop]}>
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
  // Picks up the visual breathing room the now-removed "Choose up to
  // 3" hint used to provide. The headline + sub already communicate
  // the rule, so a separate hint line was redundant.
  gridSpaceTop: { marginTop: 28 },

  // 3-column grid matching the standardized ingredient-card pattern.
  // See preferences.tsx pantryGrid for why `justifyContent:
  // space-between` (NOT `gap`) — gap + 31.5% overflows the row on
  // phone widths and forces a 2-column wrap. Vertical spacing
  // comes from marginBottom on the cell.
  //
  // 6 priorities in 3 columns now produces a clean 3+3 layout —
  // the trim from 8 to 6 also dropped the trailing "lonely" row.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '31.5%',
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#F6F1E8',
    borderWidth: 1,
    borderColor: '#E6DFD2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
  },
  cardSelected: {
    borderColor: PALETTE.sageDeep,
    backgroundColor: 'rgba(95,135,106,0.08)',
  },
  // Sized for the 3-col card layout (cards are ~107px square at
  // common phone widths). 52×52 wrap + 26 icon leaves room for the
  // label below without cramping. Was 64×64 / 34 when the cards
  // were 47% (2-col) and had room to spare.
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(95,135,106,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2F4F3E',
    paddingHorizontal: 2,
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

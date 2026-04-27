import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tapLight, tapMedium, tapSoft, success } from '@/lib/haptics';

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
  violet: '#6F5FA3',
  violetSoft: '#E8E5F0',
};

type Goal = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap };

const GOALS: Goal[] = [
  { key: 'kitchen', label: 'Kitchen spray', icon: 'restaurant-outline' },
  { key: 'bathroom', label: 'Bathroom cleaner', icon: 'water-outline' },
  { key: 'linen', label: 'Linen mist', icon: 'bed-outline' },
  { key: 'body', label: 'Body care', icon: 'flower-outline' },
  { key: 'candle', label: 'Candle / wax', icon: 'flame-outline' },
  { key: 'room', label: 'Room mist', icon: 'cloudy-outline' },
];

const SCENTS = ['Fragrance-free', 'Citrus', 'Lavender', 'Eucalyptus', 'Cozy / amber', 'Rose'];
const NOTES = ['Pet-safe', 'Baby-safe', 'No vinegar', 'No essential oils', 'Vegan', 'Stone-safe'];

type Phase = 'compose' | 'thinking' | 'result';

const SUGGESTED_RECIPE = {
  title: 'Lavender Mist · Calm Edition',
  blurb: 'A soft botanical mist tuned to your inputs — sleep-friendly, baby-safe, no vinegar.',
  ingredients: [
    { name: 'Distilled water', amount: '¾ cup' },
    { name: 'Witch hazel', amount: '3 tbsp' },
    { name: 'Lavender essential oil', amount: '20 drops' },
    { name: 'Roman chamomile oil', amount: '6 drops' },
    { name: 'Vegetable glycerin', amount: '½ tsp' },
  ],
  steps: [
    'Pour witch hazel into a 4 oz glass spray bottle.',
    'Add lavender + chamomile oils, swirl 10 seconds.',
    'Add glycerin so the scent lingers on fabric.',
    'Top with distilled water and shake gently.',
    'Mist 12" away from sheets or pajamas before bed.',
  ],
  time: '4 min',
  retailRange: '€9 – €14',
  yourCost: '€3.20',
};

export default function Build() {
  const [phase, setPhase] = useState<Phase>('compose');
  const [goal, setGoal] = useState<string | null>(null);
  const [scent, setScent] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>(['Baby-safe']);
  const [prompt, setPrompt] = useState(
    'Calming linen mist for the bedroom — lavender, no vinegar.',
  );
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'thinking') return;
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]),
      );
    make(dot1, 0).start();
    make(dot2, 140).start();
    make(dot3, 280).start();
  }, [phase, dot1, dot2, dot3]);

  const toggleNote = (n: string) => {
    tapLight();
    setNotes((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const generate = () => {
    if (!goal) return;
    tapMedium();
    setPhase('thinking');
    setTimeout(() => {
      success();
      setPhase('result');
    }, 1800);
  };

  const reset = () => {
    tapLight();
    setPhase('compose');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => {
            tapLight();
            router.back();
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={20} color={PALETTE.text} />
        </Pressable>
        <View style={styles.topPill}>
          <Ionicons name="flask" size={12} color={PALETTE.violet} />
          <Text style={styles.topPillText}>Custom formula</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {phase === 'result' ? (
          <ResultView onReset={reset} />
        ) : (
          <>
            <Text style={styles.eyebrow}>BUILD</Text>
            <Text style={styles.title}>Tell PureCraft{`\n`}what you’re making.</Text>
            <Text style={styles.sub}>
              Describe it in plain language. We’ll draft a clean formula tuned to your pantry and
              region.
            </Text>

            <View style={styles.promptCard}>
              <View style={styles.promptHeader}>
                <View style={styles.promptIcon}>
                  <Ionicons name="sparkles" size={14} color={PALETTE.violet} />
                </View>
                <Text style={styles.promptLabel}>Your brief</Text>
              </View>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="A gentle linen mist for sheets — lavender, no vinegar, baby-safe."
                placeholderTextColor={PALETTE.textSubtle}
                multiline
                style={styles.promptInput}
              />
            </View>

            <Text style={styles.section}>What are you making?</Text>
            <View style={styles.goalGrid}>
              {GOALS.map((g) => {
                const isOn = goal === g.key;
                return (
                  <Pressable
                    key={g.key}
                    onPress={() => {
                      tapLight();
                      setGoal(g.key);
                    }}
                    style={({ pressed }) => [
                      styles.goalCard,
                      isOn && styles.goalCardActive,
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <View
                      style={[styles.goalIconWrap, isOn && { backgroundColor: PALETTE.violet }]}
                    >
                      <Ionicons
                        name={g.icon}
                        size={18}
                        color={isOn ? '#FFFFFF' : PALETTE.violet}
                      />
                    </View>
                    <Text style={styles.goalLabel}>{g.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.section}>Scent direction</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {SCENTS.map((s) => {
                const isOn = scent === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => {
                      tapLight();
                      setScent(s);
                    }}
                    style={({ pressed }) => [
                      styles.chip,
                      isOn && styles.chipActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={[styles.chipText, isOn && styles.chipTextActive]}>{s}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.section}>Constraints</Text>
            <View style={styles.notesGrid}>
              {NOTES.map((n) => {
                const isOn = notes.includes(n);
                return (
                  <Pressable
                    key={n}
                    onPress={() => toggleNote(n)}
                    style={({ pressed }) => [
                      styles.noteChip,
                      isOn && styles.noteChipActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    {isOn ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                    <Text style={[styles.noteText, isOn && { color: '#FFFFFF' }]}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: 28 }} />

            <Pressable
              onPress={generate}
              disabled={!goal || phase === 'thinking'}
              style={({ pressed }) => [
                styles.cta,
                (!goal || phase === 'thinking') && styles.ctaDisabled,
                pressed && goal && phase !== 'thinking' && { opacity: 0.92 },
              ]}
            >
              {phase === 'thinking' ? (
                <View style={styles.thinkingRow}>
                  <Animated.View style={[styles.thinkDot, { opacity: dot1 }]} />
                  <Animated.View style={[styles.thinkDot, { opacity: dot2 }]} />
                  <Animated.View style={[styles.thinkDot, { opacity: dot3 }]} />
                  <Text style={styles.ctaText}>Mixing your formula</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                  <Text style={styles.ctaText}>
                    {goal ? 'Generate my formula' : 'Pick a category to start'}
                  </Text>
                </>
              )}
            </Pressable>

            <View style={styles.disclaim}>
              <Ionicons name="leaf-outline" size={12} color={PALETTE.sageDeep} />
              <Text style={styles.disclaimText}>
                Drafts are reviewed against allergy + safety rules from your profile before they appear.
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultView({ onReset }: { onReset: () => void }) {
  return (
    <View>
      <View style={styles.resultBadge}>
        <View style={styles.resultPulse} />
        <Text style={styles.resultBadgeText}>Draft formula · ready to make</Text>
      </View>
      <Text style={styles.resultTitle}>{SUGGESTED_RECIPE.title}</Text>
      <Text style={styles.resultBlurb}>{SUGGESTED_RECIPE.blurb}</Text>

      <View style={styles.resultStatsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={styles.statValue}>{SUGGESTED_RECIPE.time}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>RETAIL</Text>
          <Text style={styles.statValue}>{SUGGESTED_RECIPE.retailRange}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardHero]}>
          <Text style={[styles.statLabel, { color: '#FFFFFFCC' }]}>YOU PAY</Text>
          <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{SUGGESTED_RECIPE.yourCost}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>INGREDIENTS · 5</Text>
        {SUGGESTED_RECIPE.ingredients.map((ing, i) => (
          <View key={ing.name} style={[styles.ingRow, i === 0 && { borderTopWidth: 0 }]}>
            <View style={styles.ingDot} />
            <Text style={styles.ingName}>{ing.name}</Text>
            <Text style={styles.ingAmt}>{ing.amount}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { marginTop: 14 }]}>
        <Text style={styles.cardEyebrow}>STEPS · {SUGGESTED_RECIPE.steps.length}</Text>
        {SUGGESTED_RECIPE.steps.map((s, i) => (
          <View key={i} style={[styles.stepRow, i === 0 && { borderTopWidth: 0 }]}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{s}</Text>
          </View>
        ))}
      </View>

      <View style={styles.resultActions}>
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="refresh" size={14} color={PALETTE.text} />
          <Text style={styles.secondaryBtnText}>Tweak</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            tapSoft();
            router.push('/my-recipe');
          }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
        >
          <Ionicons name="bookmark" size={14} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Save formula</Text>
        </Pressable>
      </View>

      <View style={{ height: 60 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PALETTE.violetSoft,
    borderWidth: 1,
    borderColor: PALETTE.violet + '4D',
  },
  topPillText: { fontSize: 11.5, fontWeight: '700', color: PALETTE.violet, letterSpacing: 0.4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: PALETTE.violet,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: 13.5,
    lineHeight: 19,
    color: PALETTE.textMuted,
    marginTop: 8,
    marginBottom: 22,
  },

  promptCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  promptIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: PALETTE.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptLabel: {
    fontSize: 10.5,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: PALETTE.textMuted,
    textTransform: 'uppercase',
  },
  promptInput: {
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.text,
    minHeight: 56,
    fontWeight: '500',
  },

  section: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.text,
    marginTop: 22,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalCard: {
    width: '32%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    gap: 8,
  },
  goalCardActive: { backgroundColor: PALETTE.violetSoft, borderColor: PALETTE.violet },
  goalIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: PALETTE.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.text,
    textAlign: 'center',
  },

  chipRow: { gap: 8, paddingRight: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipActive: { backgroundColor: PALETTE.violet, borderColor: PALETTE.violet },
  chipText: { fontSize: 12.5, fontWeight: '600', color: PALETTE.text },
  chipTextActive: { color: '#FFFFFF' },

  notesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  noteChipActive: { backgroundColor: PALETTE.sageDeep, borderColor: PALETTE.sageDeep },
  noteText: { fontSize: 12, fontWeight: '600', color: PALETTE.text },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: PALETTE.violet,
    shadowColor: PALETTE.violet,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ctaDisabled: { backgroundColor: '#C5BCD8', shadowOpacity: 0, elevation: 0 },
  ctaText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  thinkDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: '#FFFFFF' },

  disclaim: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: PALETTE.sageSoft,
  },
  disclaimText: {
    flex: 1,
    fontSize: 11,
    color: PALETTE.sageDeep,
    fontWeight: '500',
    lineHeight: 15,
  },

  // Result view
  resultBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.violetSoft,
    marginBottom: 12,
  },
  resultPulse: { width: 6, height: 6, borderRadius: 999, backgroundColor: PALETTE.violet },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.violet,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  resultTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.5,
  },
  resultBlurb: { fontSize: 13.5, lineHeight: 19, color: PALETTE.textMuted, marginTop: 8 },

  resultStatsRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  statCardHero: { backgroundColor: PALETTE.sageDeep, borderColor: PALETTE.sageDeep },
  statLabel: {
    fontSize: 9.5,
    letterSpacing: 1.1,
    fontWeight: '700',
    color: PALETTE.textMuted,
  },
  statValue: { fontSize: 16, fontWeight: '700', color: PALETTE.text, marginTop: 4 },

  card: {
    marginTop: 18,
    padding: 14,
    borderRadius: 20,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  cardEyebrow: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: PALETTE.textMuted,
    marginBottom: 8,
    marginLeft: 2,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  ingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.sage },
  ingName: { flex: 1, fontSize: 13, fontWeight: '600', color: PALETTE.text },
  ingAmt: { fontSize: 12, color: PALETTE.textMuted, fontWeight: '500' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18, color: PALETTE.text },

  resultActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  secondaryBtnText: { fontSize: 12.5, fontWeight: '700', color: PALETTE.text, letterSpacing: 0.3 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  primaryBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
});

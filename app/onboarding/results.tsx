import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { BACKGROUND_PRIMARY } from '@/constants/theme';
import { getRecommendedRecipes, type Recipe } from '@/constants/recipes';
import { useAllRecipes } from '@/constants/recipes-remote';
import { events } from '@/lib/analytics';
import { useAuth } from '@/lib/auth';
import { useOnboardingAnswers } from '@/lib/onboarding-answers';
import { setOnboardingComplete } from '@/lib/onboarding-storage';
import { completeOnboarding, useProfile } from '@/lib/profile';
import { recipeIcon } from '@/lib/recipe-icons';

const PALETTE = {
  bg: BACKGROUND_PRIMARY,
  text: '#1F1F1F',
  textMuted: '#6B6B6B',
  textSubtle: '#8A8A8A',
  surface: 'rgba(255,255,255,0.5)',
  surfaceWarm: 'rgba(255,255,255,0.5)',
  border: 'rgba(0,0,0,0.06)',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: 'rgba(255,255,255,0.5)',
  creamDeep: 'rgba(0,0,0,0.06)',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
};

const PRIORITIES_FOR_YOU = [
  { icon: 'leaf-outline' as const, title: 'Low-scent formulas', body: 'Light or unscented across cleaning + beauty.' },
  { icon: 'flower-outline' as const, title: 'Sensitive-skin beauty', body: 'Gentler ratios, oat & honey first.' },
  { icon: 'paw-outline' as const, title: 'Pet-safe home care', body: 'Eucalyptus and tea tree filtered out.' },
  { icon: 'time-outline' as const, title: 'Quick budget recipes', body: '10 min average · pantry-priced.' },
];

// Fallback when the user hasn't filled out onboarding (e.g. they hit Skip on
// every step) so the screen still has *something* to show. Real users see
// their actual picks via useProfile + useOnboardingAnswers below.
const FALLBACK_PREFS = {
  intentCategoryKeys: ['cleaning', 'home-air-freshening', 'beauty-skincare'] as const,
  household: ['adults'],
  avoidances: [] as string[],
};

export default function Results() {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(20)).current;
  const allRecipes = useAllRecipes();
  const { user } = useAuth();
  const { profile } = useProfile();
  const localAnswers = useOnboardingAnswers();

  // Source of truth: profile (when signed in) > local buffer (always present
  // during onboarding) > fallback hardcoded prefs.
  const intentCategoryKeys =
    profile?.intent_categories?.length
      ? profile.intent_categories
      : localAnswers.intent_categories?.length
        ? localAnswers.intent_categories
        : [...FALLBACK_PREFS.intentCategoryKeys];
  const household =
    profile?.household?.length
      ? profile.household
      : localAnswers.household?.length
        ? localAnswers.household
        : FALLBACK_PREFS.household;
  const avoidances =
    profile?.avoidances?.length
      ? profile.avoidances
      : localAnswers.avoidances ?? FALLBACK_PREFS.avoidances;

  const nextUp: Recipe[] = getRecommendedRecipes(
    {
      // The DB enum types `intent_categories` as string[] at the wire level
      // (it's JSONB). The recommendation engine narrows to the literal union
      // internally, so this cast is safe for any value originating from the
      // onboarding screens.
      intentCategoryKeys: intentCategoryKeys as never,
      household,
      avoidances,
    },
    allRecipes,
  ).slice(0, 3);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
          <LinearGradient
            colors={[PALETTE.bg, PALETTE.bg, PALETTE.bg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroBadge}>
              <Ionicons name="checkmark-circle" size={14} color={PALETTE.sageDeep} />
              <Text style={styles.heroBadgeText}>Profile ready</Text>
            </View>
            <Text style={styles.heroEyebrow}>Welcome to your</Text>
            <Text style={styles.heroTitle}>Custom PureCraft{`\n`}Experience</Text>
            <Text style={styles.heroSub}>
              Every recipe, ingredient, and routine will now be tuned to you.
            </Text>
          </LinearGradient>

          <Text style={styles.section}>We&apos;ll prioritize</Text>
          <View style={styles.list}>
            {PRIORITIES_FOR_YOU.map((p, i) => (
              <View
                key={p.title}
                style={[styles.row, i === 0 && { borderTopWidth: 0 }]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={p.icon} size={18} color={PALETTE.sageDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{p.title}</Text>
                  <Text style={styles.rowBody}>{p.body}</Text>
                </View>
                <View style={styles.checkPill}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.section}>First in your feed</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
          >
            {nextUp.map((n) => (
              <View key={n.id} style={styles.nextCard}>
                <View style={styles.nextSwatch}>
                  <Image
                    source={recipeIcon(n.id, n.categoryKey)}
                    testID="pc-recipe-icon"
                    style={styles.nextIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.nextTitle} numberOfLines={2}>{n.title}</Text>
                <Text style={styles.nextTag}>
                  {n.safeForKids ? 'Family-safe · ' : ''}
                  {n.time}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open PureCraft+ membership"
            onPress={() => router.push('/premium')}
            style={({ pressed }) => [
              styles.upgrade,
              pressed && { transform: [{ scale: 0.99 }], opacity: 0.96 },
            ]}
          >
            <View style={styles.upgradeRow}>
              <View style={styles.upgradeBadge}>
                <Ionicons name="sparkles" size={12} color={PALETTE.goldDeep} />
                <Text style={styles.upgradeBadgeText}>PureCraft+</Text>
              </View>
              <Text style={styles.upgradeMeta}>7-day trial</Text>
            </View>
            <Text style={styles.upgradeTitle}>Want all 120+ premium recipes too?</Text>
            <Text style={styles.upgradeSub}>
              Allergy-aware filters, family profiles, smart shopping planner.
            </Text>
            <View style={styles.upgradeCta}>
              <Text style={styles.upgradeCtaText}>See what&apos;s inside</Text>
              <Ionicons name="arrow-forward" size={13} color={PALETTE.goldDeep} />
            </View>
          </Pressable>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Start Crafting"
          trailingIcon="arrow-forward"
          onPress={() => {
            setOnboardingComplete(true);
            events.onboardingFinished();
            // If signed in, mark profile complete server-side. If not,
            // answers stay in local buffer and flush on first sign-in.
            if (user) void completeOnboarding();
            router.replace('/home');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 22, paddingBottom: 16, backgroundColor: PALETTE.bg },

  heroCard: {
    marginTop: 12,
    padding: 24,
    borderRadius: 26,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  heroBadgeText: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '700',
    color: PALETTE.sageDeep,
  },
  heroEyebrow: {
    fontSize: 13,
    color: PALETTE.textMuted,
    marginTop: 18,
    fontStyle: 'italic',
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.textMuted,
    marginTop: 10,
  },

  section: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  list: {
    backgroundColor: PALETTE.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14.5, fontWeight: '700', color: PALETTE.text, letterSpacing: -0.2 },
  rowBody: { fontSize: 12.5, color: PALETTE.textMuted, marginTop: 2, lineHeight: 17 },
  checkPill: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardRow: { gap: 12, paddingRight: 12 },
  nextCard: {
    width: 160,
    paddingBottom: 4,
    gap: 8,
  },
  nextSwatch: {
    height: 130,
    borderRadius: 18,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
  },
  nextEmoji: { fontSize: 40 },
  nextIcon: { width: '78%', height: '78%' },
  nextTitle: { fontSize: 13.5, fontWeight: '700', color: PALETTE.text, lineHeight: 17 },
  nextTag: { fontSize: 11.5, color: PALETTE.textMuted },

  upgrade: {
    marginTop: 28,
    padding: 18,
    borderRadius: 20,
    backgroundColor: PALETTE.cream,
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
    gap: 4,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
  },
  upgradeBadgeText: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: PALETTE.goldDeep },
  upgradeMeta: { fontSize: 11.5, fontWeight: '600', color: PALETTE.textMuted },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.text,
    marginTop: 8,
    letterSpacing: -0.2,
  },
  upgradeSub: { fontSize: 12.5, color: PALETTE.textMuted, lineHeight: 17, marginTop: 4 },
  upgradeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
  },
  upgradeCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.goldDeep,
    letterSpacing: 0.2,
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

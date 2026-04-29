import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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
  const { height: screenHeight } = useWindowDimensions();
  // Fall back to 380 on first paint — RNW hydrates useWindowDimensions
  // with height 0, which would otherwise collapse the hero to nothing.
  const heroHeight = screenHeight > 0 ? Math.round(screenHeight * 0.38) : 380;
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
          <View style={[styles.heroImageWrap, { height: heroHeight }]}>
            <Image
              source={require('../../assets/images/Profile-hero.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']}
              locations={[0, 0.55, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <View style={styles.heroOverlayTop}>
              <View style={styles.heroBadge}>
                <Ionicons name="checkmark-circle" size={14} color={PALETTE.sageDeep} />
                <Text style={styles.heroBadgeText}>Profile ready</Text>
              </View>
            </View>
            <View style={styles.heroOverlayBottom}>
              <Text style={styles.heroTitleNew}>Custom PureCraft Experience</Text>
              <Text style={styles.heroSubNew}>
                Every recipe, ingredient, and routine is now tuned to you.
              </Text>
            </View>
          </View>

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
            <Text style={styles.upgradeTitle}>Unlock your full experience</Text>
            <Text style={styles.upgradeSub}>
              Unlimited safe formulas, smarter recommendations, and full personalization.
            </Text>
            <View style={styles.upgradeCta}>
              <Text style={styles.upgradeCtaText}>Explore PureCraft+</Text>
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

  heroImageWrap: {
    marginHorizontal: -22,
    marginTop: 0,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlayTop: {
    position: 'absolute',
    top: 16,
    left: 22,
  },
  heroOverlayBottom: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 22,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  heroBadgeText: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '700',
    color: PALETTE.sageDeep,
  },
  heroTitleNew: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  heroSubNew: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },

  section: {
    marginTop: 32,
    marginBottom: 6,
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13,
    lineHeight: 20,
    color: PALETTE.textMuted,
    marginBottom: 18,
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
    marginTop: 8,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(199,169,107,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(199,169,107,0.22)',
    gap: 4,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
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

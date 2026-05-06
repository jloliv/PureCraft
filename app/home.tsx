import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
// TEMPORARY — Sentry verification only. Remove this import along with
// the SentryTestButton component below once events are confirmed flowing.
import * as SentryTest from '@sentry/react-native';
import {
  Dimensions,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Fallback to 320 because on web SSR Dimensions.get can return 0 width.
const _winWidth = Dimensions.get('window').width;
const CARD_WIDTH = _winWidth > 0 ? Math.round(_winWidth * 0.8) : 320;
const CARD_GAP = 12;
import { SafeAreaView } from 'react-native-safe-area-context';

import { PROBLEMS } from '@/constants/recipe-problems';

import { HomeSearch } from '@/components/home-search';
import { MakeNav } from '@/components/make-nav';
import { NewRecipesPrompt } from '@/components/new-recipes-prompt';
import { PantrySheet } from '@/components/pantry-sheet';
import { useAllRecipes } from '@/constants/recipes-remote';
import { useOnboardingAnswers } from '@/lib/onboarding-answers';
import {
  rankRecipes,
  type PriorityKey,
} from '@/lib/recipe-ranking';
import { findProduct } from '@/constants/products';
import { tapLight } from '@/lib/haptics';
import { computeMatch } from '@/lib/pantry-match';
import { usePantry } from '@/lib/pantry-store';
import { usePaywall } from '@/lib/paywall';
import { recipeIcon } from '@/lib/recipe-icons';
import { useMemo, useState } from 'react';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#1F1F1F',
  textMuted: '#6F6A60',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  surfaceWarm: '#F1ECE0',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
};

const HERO = require('../assets/images/PureCraftHero2.png');

type Category = {
  key: string; // RecipeCategoryKey
  label: string;
  image: ImageSourcePropType;
  imageScale?: number;
  imageOffsetY?: number;
  /** Optional override route. Defaults to /categories?category=<key>.
   *  Pantry Magic uses /pantry-results so it lands on the personalized
   *  "what can I make right now" screen instead of a category list. */
  route?: string;
};

// Each home tile maps to one canonical RecipeCategoryKey from
// constants/recipe-categories.ts. Tap routes to /categories?category=<key>.
const CATEGORIES: Category[] = [
  {
    key: 'cleaning',
    label: 'Bathroom & Kitchen',
    image: require('../assets/images/BathroomCleaner.jpg'),
    imageScale: 1.05,
  },
  {
    key: 'laundry',
    label: 'Laundry',
    image: require('../assets/images/laundry.jpg'),
  },
  {
    key: 'baby-family-safe',
    label: 'Baby Safe',
    image: require('../assets/images/BabySafe.jpg'),
  },
  {
    key: 'beauty-skincare',
    label: 'Beauty',
    image: require('../assets/images/KitchenCleaners.jpg'),
  },
  {
    key: 'home-air-freshening',
    label: 'Home & Scent',
    image: require('../assets/images/comfort.jpg'),
  },
  {
    // Single consolidated entry for everything pantry — opens an action
    // sheet with "Use ingredients I have" (the old Pantry Magic flow),
    // "Add ingredient manually," and "Scan ingredients." This replaces
    // the previous Pantry Magic tile so Home stays clean while every
    // pantry surface stays one tap away. See components/pantry-sheet.tsx.
    key: 'manage-pantry',
    label: 'Manage My Pantry',
    image: require('../assets/images/Pantry-Magic.jpg'),
  },
];

type QuickTool = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: '/categories' | '/saved';
  params: Record<string, string>;
};

const QUICK_TOOLS: QuickTool[] = [
  { key: 'all', label: 'All Recipes', icon: 'book-outline', route: '/categories', params: {} },
  { key: 'family-safe', label: 'Family Safe', icon: 'shield-checkmark-outline', route: '/categories', params: { safeForKids: 'true' } },
  { key: 'sprays', label: 'Mists & Sprays', icon: 'water-outline', route: '/categories', params: { tag: 'spray' } },
  { key: 'budget', label: 'Budget Hacks', icon: 'cash-outline', route: '/categories', params: { category: 'emergency-budget-hacks' } },
  { key: 'favorites', label: 'My Favorites', icon: 'heart-outline', route: '/saved', params: {} },
];

export default function HomeScreen() {
  // Pantry action sheet — opened from the "Manage My Pantry" tile in
  // the categories grid. Hoisted to the screen root so the Modal sits
  // above MakeNav (and any other absolutely-positioned siblings).
  const [pantrySheetOpen, setPantrySheetOpen] = useState(false);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <Hero />

        {/* Smart Search bar — placed between Hero and "What You Can Make
            Right Now" per spec. Owns its own focus / debounce / live
            results dropdown / suggestion chips, and routes to /search
            for full results. */}
        <HomeSearch />

        <MakeNowSection />

        <ProblemSection />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <Pressable hitSlop={8} onPress={() => router.push('/categories')}>
            <Text style={styles.sectionAction}>View All ›</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <CategoryCard
              key={c.key}
              category={c}
              // Special-case the consolidated pantry tile — instead of
              // routing it pops the action sheet so the user picks one
              // of the three pantry flows.
              onPressOverride={
                c.key === 'manage-pantry'
                  ? () => setPantrySheetOpen(true)
                  : undefined
              }
            />
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 36 }]}>
          <Text style={styles.sectionTitle}>Quick Tools</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolsRow}
        >
          {QUICK_TOOLS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() =>
                router.push({ pathname: t.route as never, params: t.params })
              }
              style={({ pressed }) => [styles.toolCard, pressed && styles.cardPressed]}
            >
              <View style={styles.toolIcon}>
                <Ionicons name={t.icon} size={20} color={PALETTE.sageDeep} />
              </View>
              <Text style={styles.toolLabel} numberOfLines={2}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.trustBar}>
          <Text style={styles.trustText}>
            Pure Ingredients <Text style={styles.trustDot}>•</Text> Family Safe{' '}
            <Text style={styles.trustDot}>•</Text> Premium Results
          </Text>
        </View>

        <View style={{ height: 112 }} />
      </ScrollView>

      <MakeNav active="home" />

      {/* Controlled "✨ New recipes available" pill. Renders only when
          the catalog has grown since the user last saw it; auto-hides
          after 4s; tap routes to /discover. Replaces the always-on
          pulse dot that used to sit on the FAB. */}
      <NewRecipesPrompt />

      <PantrySheet
        visible={pantrySheetOpen}
        onClose={() => setPantrySheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function Header() {
  const { isPremium } = usePaywall();
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }} />
      {/* TEMPORARY — Sentry verification button. Renders only in
          dev so it never ships to production. Remove this entire
          Pressable + the import below once Sentry is confirmed
          working in the dashboard. */}
      {__DEV__ ? <SentryTestButton /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPremium ? 'PureCraft+ membership' : 'Upgrade to PureCraft+'}
        onPress={() => {
          tapLight();
          router.push('/premium');
        }}
        style={({ pressed }) => [
          styles.plusBadge,
          isPremium ? styles.plusBadgePaid : styles.plusBadgeFree,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Ionicons
          name="sparkles"
          size={11}
          color={isPremium ? '#FFFFFF' : PALETTE.goldDeep}
        />
        <Text
          style={[
            styles.plusBadgeText,
            isPremium ? styles.plusBadgeTextPaid : styles.plusBadgeTextFree,
          ]}
        >
          {isPremium ? 'PureCraft+ ✓' : 'PureCraft+'}
        </Text>
      </Pressable>
    </View>
  );
}

// =============================================================================
// TEMPORARY — Sentry verification button (delete after confirmation).
// =============================================================================
//
// Direct-import pattern matches the wizard's recommended snippet so
// we route through whatever init the wizard wired up. Tapping fires
// `captureException` synchronously — within ~30s the error appears
// in https://futurebuilt-tech.sentry.io/issues/?project=…
//
// To remove: delete this function + the `__DEV__ &&` line above + the
// `import * as Sentry from '@sentry/react-native'` line at the top.
// Three deletions, all in this file. No other surface depends on it.

function SentryTestButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Send test event to Sentry"
      onPress={() => {
        // Throwing-and-catching keeps the test contained — RN's
        // ErrorUtils handler would otherwise turn an uncaught throw
        // into a red-screen crash, which sends a DIFFERENT (uncaught)
        // event. Explicit captureException is what the wizard wants.
        try {
          throw new Error('Sentry test event from Home header');
        } catch (e) {
          SentryTest.captureException(e);
        }
      }}
      style={({ pressed }) => [
        styles.sentryTestBtn,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name="bug-outline" size={11} color="#A98A4D" />
      <Text style={styles.sentryTestText}>Test Sentry</Text>
    </Pressable>
  );
}

// "What You Can Make Right Now" — pulls every catalog recipe whose
// ingredient list is 100% covered by the pantry. Capped at 5 because the
// section is meant to feel curated, not overwhelming. Renders nothing
// when nothing matches — Home stays clean for empty pantries.
// Problem-driven entry path (third lens after Pantry Magic and
// Categories). Chips here route to /categories?problem=<id> which
// filters the catalog through recipeMatchesProblem in
// constants/recipe-problems.ts.
function ProblemSection() {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>What can we tackle?</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.problemRow}
      >
        {PROBLEMS.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`${p.label} recipes`}
            onPress={() =>
              router.push({
                pathname: '/categories',
                params: { problem: p.id },
              })
            }
            style={({ pressed }) => [
              styles.problemChip,
              { backgroundColor: p.bg },
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <View style={[styles.problemChipIcon, { backgroundColor: '#FFFFFFB0' }]}>
              <Ionicons name={p.icon} size={16} color={p.tint} />
            </View>
            <Text style={[styles.problemChipText, { color: p.tint }]}>
              {p.shortLabel}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function MakeNowSection() {
  const allRecipes = useAllRecipes();
  const pantry = usePantry();
  // Pull the user's priorities + avoidances from the onboarding
  // buffer. We use the local buffer (not Supabase profile) because
  // it covers guest mode AND signed-in mode — the buffer is
  // hydrated immediately on launch, while the profile may still be
  // loading on first paint.
  const answers = useOnboardingAnswers();

  const ready = useMemo(() => {
    // Stage 1 — pantry match. Same filter as before: only recipes
    // every ingredient is satisfied for.
    const matches = allRecipes
      .map((r) => ({
        recipe: r,
        match: computeMatch(r.ingredients, pantry),
      }))
      .filter((m) => m.match.status === 'ready' && m.match.total > 0);
    if (matches.length === 0) return [];

    // Stage 2 — rank the pantry-ready set by the user's priorities
    // (lib/recipe-ranking.ts handles weighting + allergy filter +
    // top-N cap). When the user has no priorities yet (skipped
    // onboarding), fall back to the original pantry-coverage sort
    // so empty-priority users aren't worse off than before.
    const priorities = (answers.priorities ?? []) as PriorityKey[];
    if (priorities.length === 0) {
      return matches
        .sort((a, b) => b.match.percent - a.match.percent)
        .slice(0, 5);
    }
    const ranked = rankRecipes(
      matches.map((m) => m.recipe),
      {
        priorities,
        avoidances: answers.avoidances ?? [],
        limit: 5,
      },
    );
    // Pair the ranked recipes back with their match objects so the
    // existing card renderer (which uses match.percent etc.) keeps
    // working unchanged.
    const byId = new Map(matches.map((m) => [m.recipe.id, m]));
    return ranked
      .map((r) => byId.get(r.recipe.id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));
  }, [allRecipes, pantry, answers.priorities, answers.avoidances]);

  if (ready.length === 0) return null;

  return (
    <>
      <View style={[styles.sectionHeader, { marginTop: 28 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>What You Can Make Right Now</Text>
          <Text style={styles.makeNowCaption}>
            Every ingredient is in your pantry
          </Text>
        </View>
        <Pressable hitSlop={8} onPress={() => router.push('/pantry')}>
          <Text style={styles.sectionAction}>See all ›</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.makeNowRow}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {ready.map(({ recipe }) => {
          const product = findProduct(recipe.id);
          return (
            <Pressable
              key={recipe.id}
              onPress={() => {
                tapLight();
                router.push({ pathname: '/result', params: { id: recipe.id } });
              }}
              style={({ pressed }) => [
                styles.makeNowCard,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[styles.makeNowSwatch, { backgroundColor: product.swatch }]}>
                <Image
                  source={recipeIcon(recipe.id, recipe.categoryKey)}
                  testID="pc-recipe-icon"
                  style={styles.makeNowIcon}
                  resizeMode="cover"
                />
                <View style={styles.makeNowReadyBadge}>
                  <View style={styles.makeNowReadyDot} />
                  <Text style={styles.makeNowReadyText}>Ready</Text>
                </View>
              </View>
              <Text style={styles.makeNowTitle} numberOfLines={2}>
                {recipe.title}
              </Text>
              <Text style={styles.makeNowMeta}>{recipe.time}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

function Hero() {
  return (
    <Pressable
      onPress={() => router.push('/categories')}
      accessibilityRole="button"
      accessibilityLabel="Get started — explore categories"
      style={({ pressed }) => [styles.heroWrap, pressed && { opacity: 0.95 }]}
    >
      <View style={styles.heroAspect}>
        <Image source={HERO} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(248,246,241,0.96)', 'rgba(248,246,241,0.78)', 'rgba(248,246,241,0)']}
          locations={[0, 0.4, 0.78]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Create{`\n`}Pure Products</Text>
          <Text style={styles.heroSub}>
            Clean. Natural. Non-Toxic.{`\n`}Made by you, for your home.
          </Text>
          <View style={styles.heroCta}>
            <Text style={styles.heroCtaText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function CategoryCard({
  category,
  onPressOverride,
}: {
  category: Category;
  /** When set, runs instead of the default routing — used by the
   *  Manage My Pantry tile to open the pantry action sheet. */
  onPressOverride?: () => void;
}) {
  const transforms: ({ scale: number } | { translateY: number })[] = [];
  if (category.imageScale != null) transforms.push({ scale: category.imageScale });
  if (category.imageOffsetY != null) transforms.push({ translateY: category.imageOffsetY });
  const imageStyle = transforms.length
    ? [styles.catImageInner, { transform: transforms }]
    : styles.catImageInner;

  return (
    <Pressable
      onPress={() => {
        if (onPressOverride) {
          onPressOverride();
          return;
        }
        // Categories that supply their own `route` (e.g. legacy Pantry
        // Magic) bypass the default category-list path.
        if (category.route) {
          router.push(category.route as never);
          return;
        }
        router.push({
          pathname: '/categories',
          params: { category: category.key },
        });
      }}
      style={({ pressed }) => [styles.catCard, pressed && styles.cardPressed]}
    >
      <ImageBackground
        source={category.image}
        style={styles.catImage}
        imageStyle={imageStyle}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.catLabel}>{category.label}</Text>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerSide: {
    width: 40,
    height: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 88,
    height: 88,
    marginVertical: -22,
  },
  plusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  plusBadgeFree: {
    backgroundColor: PALETTE.surface,
    borderColor: '#E5DCC2',
  },
  // TEMPORARY — Sentry verification button. Delete with the
  // SentryTestButton component once events are confirmed.
  sentryTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5DCC2',
    backgroundColor: '#FFF8EC',
    marginRight: 8,
  },
  sentryTestText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#A98A4D',
    letterSpacing: 0.4,
  },
  plusBadgePaid: {
    backgroundColor: PALETTE.gold,
    borderColor: PALETTE.goldDeep,
  },
  plusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  plusBadgeTextFree: { color: PALETTE.goldDeep },
  plusBadgeTextPaid: { color: '#FFFFFF' },

  heroWrap: {
    marginTop: 16,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: PALETTE.surfaceWarm,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  heroAspect: {
    width: '100%',
    aspectRatio: 1448 / 1086,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: PALETTE.surfaceWarm,
    justifyContent: 'center',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroContent: {
    paddingHorizontal: 22,
    paddingVertical: 26,
    maxWidth: '70%',
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.6,
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 18,
    color: PALETTE.textMuted,
    marginTop: 10,
    fontWeight: '400',
  },
  heroCta: {
    marginTop: 18,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PALETTE.text,
  },
  heroCtaText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.goldDeep,
  },

  // -- "What can we tackle?" problem chips -------------------------------
  // Horizontal-scroll row sitting below MakeNowSection. Each chip is a
  // pill with a tinted background + icon + label. Tap routes to
  // /categories?problem=<id>, which categories.tsx filters via
  // recipeMatchesProblem in constants/recipe-problems.ts.
  problemRow: {
    paddingRight: 8,
    gap: 10,
  },
  problemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  problemChipIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  problemChipText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // -- "What You Can Make Right Now" -------------------------------------
  makeNowCaption: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  makeNowRow: { gap: CARD_GAP, paddingLeft: 16, paddingRight: 0 },
  makeNowCard: { width: CARD_WIDTH, gap: 8 },
  makeNowSwatch: {
    height: 138,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  makeNowIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  makeNowReadyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  makeNowReadyDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  makeNowReadyText: {
    fontSize: 9.5,
    letterSpacing: 1,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  makeNowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.text,
    lineHeight: 17,
  },
  makeNowMeta: { fontSize: 11.5, color: PALETTE.textMuted, marginTop: -2 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  catCard: {
    width: '48%',
    aspectRatio: 0.92,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: PALETTE.surfaceWarm,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  catImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  catImageInner: {
    borderRadius: 22,
  },
  catLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },

  toolsRow: {
    gap: 12,
    paddingRight: 12,
  },
  toolCard: {
    width: 100,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    gap: 10,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#EAEFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    fontWeight: '600',
    color: PALETTE.text,
  },

  trustBar: {
    marginTop: 32,
    alignItems: 'center',
  },
  trustText: {
    fontSize: 11,
    letterSpacing: 1.6,
    color: PALETTE.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  trustDot: {
    color: PALETTE.gold,
  },
});

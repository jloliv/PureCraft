import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MakeNav } from '@/components/make-nav';
import { useAllRecipes } from '@/constants/recipes-remote';
import { findProduct } from '@/constants/products';
import { tapLight } from '@/lib/haptics';
import { computeMatch } from '@/lib/pantry-match';
import { usePantry } from '@/lib/pantry-store';
import { recipeIcon } from '@/lib/recipe-icons';
import { useMemo } from 'react';

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
    label: 'Comfort',
    image: require('../assets/images/comfort.jpg'),
  },
  {
    key: 'emergency-budget-hacks',
    label: 'Pantry Magic',
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
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <Hero />

        <MakeNowSection />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <Pressable hitSlop={8} onPress={() => router.push('/categories')}>
            <Text style={styles.sectionAction}>View All ›</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <CategoryCard key={c.key} category={c} />
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
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        onPress={() => {}}
        style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="notifications-outline" size={20} color={PALETTE.text} />
      </Pressable>
    </View>
  );
}

// "What You Can Make Right Now" — pulls every catalog recipe whose
// ingredient list is 100% covered by the pantry. Capped at 5 because the
// section is meant to feel curated, not overwhelming. Renders nothing
// when nothing matches — Home stays clean for empty pantries.
function MakeNowSection() {
  const allRecipes = useAllRecipes();
  const pantry = usePantry();

  const ready = useMemo(() => {
    const matches = allRecipes
      .map((r) => ({
        recipe: r,
        match: computeMatch(r.ingredients, pantry),
      }))
      .filter((m) => m.match.status === 'ready' && m.match.total > 0)
      .sort((a, b) => b.match.percent - a.match.percent);
    return matches.slice(0, 5);
  }, [allRecipes, pantry]);

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
                  resizeMode="contain"
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

function CategoryCard({ category }: { category: Category }) {
  const transforms: ({ scale: number } | { translateY: number })[] = [];
  if (category.imageScale != null) transforms.push({ scale: category.imageScale });
  if (category.imageOffsetY != null) transforms.push({ translateY: category.imageOffsetY });
  const imageStyle = transforms.length
    ? [styles.catImageInner, { transform: transforms }]
    : styles.catImageInner;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/categories', params: { category: category.key } })
      }
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
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },

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

  // -- "What You Can Make Right Now" -------------------------------------
  makeNowCaption: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  makeNowRow: { gap: 12, paddingRight: 12 },
  makeNowCard: { width: 168, gap: 8 },
  makeNowSwatch: {
    height: 138,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  makeNowIcon: {
    position: 'absolute',
    top: '11%',
    left: '11%',
    width: '78%',
    height: '78%',
  },
  makeNowReadyBadge: {
    alignSelf: 'flex-start',
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

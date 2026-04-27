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
  key: string;
  label: string;
  image: ImageSourcePropType;
  imageScale?: number;
  imageOffsetY?: number;
};

const CATEGORIES: Category[] = [
  { key: 'bathroom', label: 'Bathroom Cleaners', image: require('../assets/images/BathroomCleaner.jpg'), imageScale: 1.05 },
  { key: 'kitchen', label: 'Kitchen Cleaners', image: require('../assets/images/KitchenCleaners.jpg') },
  { key: 'laundry', label: 'Laundry', image: require('../assets/images/laundry.jpg') },
  { key: 'baby-safe', label: 'Baby Safe', image: require('../assets/images/BabySafe.jpg') },
  { key: 'comfort', label: 'Comfort', image: require('../assets/images/comfort.jpg') },
  { key: 'pantry-magic', label: 'Pantry Magic', image: require('../assets/images/Pantry-Magic.jpg') },
];

type QuickTool = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const QUICK_TOOLS: QuickTool[] = [
  { key: 'all', label: 'All Recipes', icon: 'book-outline', route: '/categories' },
  { key: 'glow', label: 'Glow Boosters', icon: 'sparkles-outline', route: '/categories' },
  { key: 'mists', label: 'Mists & Sprays', icon: 'water-outline', route: '/categories' },
  { key: 'ingredients', label: 'Ingredients Guide', icon: 'leaf-outline', route: '/categories' },
  { key: 'favorites', label: 'My Favorites', icon: 'heart-outline', route: '/saved' },
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
              onPress={() => router.push(t.route as never)}
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
      onPress={() => router.push('/categories')}
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

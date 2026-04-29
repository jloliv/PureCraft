// Discover — premium / luxury redesign.
//
// Design direction: calm, expensive, effortless. Apple × Aesop × Calm × Airbnb.
// Warm ivory base, sage green accents, soft shadows, generous whitespace,
// and refined motion (hero fade-in, rotating tagline, staggered chips,
// search-bar pulse on focus).
//
// Notes for future iteration:
//  - We fake "frosted glass" via translucent white + 1px subtle border + soft
//    shadow. When `expo-blur` is added to the project, swap the wrapper Views
//    for <BlurView intensity={50} tint="light"> for the real effect on iOS.
//  - 8pt spacing is enforced via the SPC constant.

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MakeNav } from '@/components/make-nav';
import { formatMoney, useCurrency } from '@/constants/currency';
import { findProduct, RECIPES } from '@/constants/products';
import { tapLight } from '@/lib/haptics';
import { recipeIcon, RECIPE_ICON_BLEND } from '@/lib/recipe-icons';

// ---------- Tokens ---------------------------------------------------------
// 8pt spacing system. Never break the rhythm.
const SPC = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 } as const;

const PALETTE = {
  bg: '#F8F6F1',
  text: '#111111',
  textWarm: '#6F6A60',
  textMuted: '#8A8377',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  surfaceWarm: '#F1ECE0',
  border: '#E9E4DA',
  borderSoft: '#F0EADA',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageEyebrow: '#7A8E78',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
  goldAccent: '#B89A52',
};

// ---------- Content data ---------------------------------------------------

const TAGLINES = [
  'Cleaner home, naturally',
  'Save money beautifully',
  'Luxury you make yourself',
  'Wellness begins at home',
] as const;

const WEEKLY_PICK = {
  productId: 'citrus-countertop-cleaner',
  eyebrow: 'Pick of the Week',
  title: 'Glow Routine',
  blurb: 'Citrus countertop cleaner with spa-level freshness',
  image: require('../assets/images/PureCraftHero2.png'),
};

type Intent = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
};

const INTENTS: Intent[] = [
  { key: 'save', label: 'Save Money', icon: 'cash-outline', tint: '#A98A4D', bg: '#F7F2E7' },
  { key: 'pet', label: 'Pet Safe', icon: 'paw-outline', tint: '#7E8F75', bg: '#E4EDE5' },
  { key: 'baby', label: 'Baby Safe', icon: 'happy-outline', tint: '#9C7A4F', bg: '#F1ECE0' },
  { key: 'sensitive', label: 'Sensitive Skin', icon: 'flower-outline', tint: '#B86F44', bg: '#F7EFE7' },
  { key: 'low-scent', label: 'Low Scent', icon: 'leaf-outline', tint: '#7E8F75', bg: '#E4EDE5' },
  { key: 'fast', label: 'Fast to Make', icon: 'time-outline', tint: '#6F5FA3', bg: '#EDE9F2' },
];

const TRENDING = [
  { id: 'bathroom-cleaner', stat: '1.2k made this week' },
  { id: 'linen-spray', stat: '880 made this week' },
  { id: 'kitchen-spray', stat: '760 made this week' },
  { id: 'sugar-scrub', stat: '540 made this week' },
];

const QUICK = ['glass-cleaner', 'laundry-booster', 'bathroom-cleaner', 'room-spray'];
const BUDGET_IDS = ['bathroom-cleaner', 'glass-cleaner', 'laundry-booster', 'kitchen-spray'];

const SEASONAL = [
  { id: 'linen-spray', tag: 'Spring linen refresh' },
  { id: 'room-spray', tag: 'Open-window mist' },
  { id: 'glass-cleaner', tag: 'Daylight clean' },
  { id: 'floor-cleaner', tag: 'Pollen reset' },
];

const PERSONAL = [
  { id: 'kitchen-spray', reason: 'Because you cook often' },
  { id: 'citrus-glow-scrub', reason: 'Matches your beauty profile' },
  { id: 'floor-cleaner', reason: 'Pet-safe pick' },
];

const PANTRY_STATS = {
  ingredientCount: 7,
  recipesAvailable: 4,
  topItems: ['💧', '🧂', '🍋', '🫧', '🌱'],
};

function recipeCostUsd(productId: string): number {
  const r = RECIPES[productId];
  if (!r) return 0;
  return r.ingredients
    .filter((i) => !i.haveIt)
    .reduce((sum, i) => sum + (i.storePriceUsd ?? 0), 0);
}

// ---------- Screen ---------------------------------------------------------

export default function Discover() {
  const { currency } = useCurrency();
  const [query, setQuery] = useState('');

  // Mount-in animation: hero fades + lifts. Other content drops in slightly
  // staggered to feel premium, not theatrical.
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, lift]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <SearchBar query={query} onChange={setQuery} />

        <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
          <HeroCard />
        </Animated.View>

        <View style={styles.sectionGap} />

        <SectionHeader
          title="What matters this week"
          caption="One tap to personalize"
        />
        <ChipRow />

        <SectionHeader
          title="Trending now"
          caption="What other homes are mixing"
          actionLabel="See all"
          onAction={() => router.push('/categories')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardRow}
          decelerationRate="fast"
          snapToInterval={244}
        >
          {TRENDING.map((t) => {
            const p = findProduct(t.id);
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  tapLight();
                  router.push({ pathname: '/preferences', params: { id: t.id } });
                }}
                style={({ pressed }) => [
                  styles.bigCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={[styles.bigSwatch, { backgroundColor: p.swatch }]}>
                  <Image
                    source={recipeIcon(t.id)}
                    testID="pc-recipe-icon"
                    style={[styles.cardIcon, RECIPE_ICON_BLEND]}
                    resizeMode="cover"
                  />
                  <View style={styles.trendingBadge}>
                    <View style={styles.trendingPulse} />
                    <Text style={styles.trendingBadgeText}>Trending</Text>
                  </View>
                </View>
                <View style={styles.bigBody}>
                  <Text style={styles.bigTitle} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={styles.bigMeta}>{t.stat}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionHeader
          title="5-minute fixes"
          caption="Done before the kettle boils"
          actionLabel="More quick wins"
          onAction={() => router.push('/categories')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.smallRow}
        >
          {QUICK.map((id) => {
            const p = findProduct(id);
            return (
              <Pressable
                key={id}
                onPress={() => {
                  tapLight();
                  router.push({ pathname: '/preferences', params: { id } });
                }}
                style={({ pressed }) => [
                  styles.smallCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={[styles.smallSwatch, { backgroundColor: p.swatch }]}>
                  <Image
                    source={recipeIcon(id)}
                    testID="pc-recipe-icon"
                    style={[styles.cardIcon, RECIPE_ICON_BLEND]}
                    resizeMode="cover"
                  />
                  <View style={styles.timePill}>
                    <Ionicons name="time-outline" size={11} color={PALETTE.text} />
                    <Text style={styles.timePillText}>{p.time}</Text>
                  </View>
                </View>
                <Text style={styles.smallTitle} numberOfLines={2}>
                  {p.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionHeader
          title={`Under ${formatMoney(5, { currency, decimals: 0 })}`}
          caption="Pantry-priced wins"
          actionLabel="See all"
          onAction={() => router.push('/categories')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.smallRow}
        >
          {BUDGET_IDS.map((id) => {
            const p = findProduct(id);
            const cost = recipeCostUsd(id);
            return (
              <Pressable
                key={id}
                onPress={() => {
                  tapLight();
                  router.push({ pathname: '/preferences', params: { id } });
                }}
                style={({ pressed }) => [
                  styles.smallCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={[styles.smallSwatch, { backgroundColor: p.swatch }]}>
                  <Image
                    source={recipeIcon(id)}
                    testID="pc-recipe-icon"
                    style={[styles.cardIcon, RECIPE_ICON_BLEND]}
                    resizeMode="cover"
                  />
                  <View style={[styles.costPill, { borderColor: p.accent }]}>
                    <Text style={[styles.costPillText, { color: p.accent }]}>
                      {formatMoney(cost, { currency })} to make
                    </Text>
                  </View>
                </View>
                <Text style={styles.smallTitle} numberOfLines={2}>
                  {p.title}
                </Text>
                <Text style={styles.smallMeta}>
                  Saves {formatMoney(p.savingsUsd, { currency })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionHeader
          title="Spring Edit"
          caption="Refresh your home for the season"
          actionLabel="View edit"
          onAction={() => router.push('/categories')}
        />
        <View style={styles.seasonalGrid}>
          {SEASONAL.map((s, i) => {
            const p = findProduct(s.id);
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  tapLight();
                  router.push({ pathname: '/preferences', params: { id: s.id } });
                }}
                style={({ pressed }) => [
                  styles.seasonalCard,
                  i === 0 && styles.seasonalCardWide,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={[styles.seasonalSwatch, { backgroundColor: p.swatch }]}>
                  <Image
                    source={recipeIcon(s.id)}
                    testID="pc-recipe-icon"
                    style={[styles.seasonalIcon, RECIPE_ICON_BLEND]}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.seasonalBody}>
                  <Text style={styles.seasonalTag}>{s.tag.toUpperCase()}</Text>
                  <Text style={styles.seasonalTitle} numberOfLines={1}>
                    {p.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader
          title="Made for your home"
          caption="Tuned to your profile"
          actionLabel="View all"
          onAction={() => router.push('/categories')}
        />
        <View style={styles.personalList}>
          {PERSONAL.map((item, i) => {
            const p = findProduct(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  tapLight();
                  router.push({ pathname: '/preferences', params: { id: item.id } });
                }}
                style={({ pressed }) => [
                  styles.personalRow,
                  i === 0 && { borderTopWidth: 0 },
                  pressed && { backgroundColor: PALETTE.surfaceWarm },
                ]}
              >
                <View style={[styles.personalSwatch, { backgroundColor: p.swatch }]}>
                  <Image
                    source={recipeIcon(item.id)}
                    testID="pc-recipe-icon"
                    style={[styles.personalIcon, RECIPE_ICON_BLEND]}
                    resizeMode="cover"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personalReason}>{item.reason}</Text>
                  <Text style={styles.personalTitle}>{p.title}</Text>
                  <Text style={styles.personalMeta}>
                    {p.time} · save {formatMoney(p.savingsUsd, { currency })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.textSubtle} />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            tapLight();
            router.push('/pantry');
          }}
          style={({ pressed }) => [
            styles.pantryCard,
            pressed && { opacity: 0.96, transform: [{ scale: 0.99 }] },
          ]}
        >
          <LinearGradient
            colors={['#EFE7D2', '#F7F2E7', '#E4EDE5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pantryGradient}
          >
            <View style={styles.pantryHeader}>
              <View style={styles.pantryBadge}>
                <Ionicons name="leaf" size={12} color={PALETTE.sageDeep} />
                <Text style={styles.pantryBadgeText}>Your pantry</Text>
              </View>
              <View style={styles.emojiRow}>
                {PANTRY_STATS.topItems.map((e, idx) => (
                  <Text
                    key={idx}
                    style={[
                      styles.pantryItemEmoji,
                      { transform: [{ rotate: `${idx * 4 - 4}deg` }] },
                    ]}
                  >
                    {e}
                  </Text>
                ))}
              </View>
            </View>

            <Text style={styles.pantryTitle}>
              You have {PANTRY_STATS.ingredientCount} ingredients.{`\n`}
              Make {PANTRY_STATS.recipesAvailable} recipes right now.
            </Text>
            <Text style={styles.pantrySub}>
              No shopping list. Just open the cabinet and pour.
            </Text>

            <View style={styles.pantryCta}>
              <Text style={styles.pantryCtaText}>Use what I have</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => {
            tapLight();
            router.push('/premium');
          }}
          style={({ pressed }) => [
            styles.premiumWrap,
            pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
          ]}
        >
          <LinearGradient
            colors={['#7E8F75', '#5C7F6B', '#3D5A4A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumCard}
          >
            <View style={styles.premiumBadge}>
              <Ionicons name="sparkles" size={13} color="#FFFFFF" />
              <Text style={styles.premiumBadgeText}>PureCraft+</Text>
            </View>
            <Text style={styles.premiumTitle}>
              Unlock 120+ premium{`\n`}recipes & family profiles
            </Text>
            <Text style={styles.premiumSub}>
              Allergy-aware filters, smart shopping planner, expert routines.
            </Text>
            <View style={styles.premiumStats}>
              <View style={styles.premiumStat}>
                <Text style={styles.premiumStatValue}>120+</Text>
                <Text style={styles.premiumStatLabel}>premium recipes</Text>
              </View>
              <View style={styles.premiumStatDiv} />
              <View style={styles.premiumStat}>
                <Text style={styles.premiumStatValue}>
                  {formatMoney(420, { currency, round: true })}+
                </Text>
                <Text style={styles.premiumStatLabel}>saved / yr avg.</Text>
              </View>
            </View>
            <View style={styles.premiumCta}>
              <Text style={styles.premiumCtaText}>Try free for 7 days</Text>
              <Ionicons name="arrow-forward" size={14} color={PALETTE.sageDeep} />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>

      <MakeNav active="discover" />
    </SafeAreaView>
  );
}

// ---------- Header ---------------------------------------------------------

function Header() {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerEyebrow}>FOR YOU · TODAY</Text>
        <Text style={styles.headerTitle}>Discover</Text>
        <RotatingTagline />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filter"
        onPress={() => {
          tapLight();
        }}
        style={({ pressed }) => [
          styles.filterBtn,
          pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 },
        ]}
      >
        <Ionicons name="options-outline" size={18} color={PALETTE.text} />
      </Pressable>
    </View>
  );
}

function RotatingTagline() {
  const [idx, setIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Cross-fade: dim out → swap text → fade back in
      Animated.timing(opacity, {
        toValue: 0,
        duration: 320,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setIdx((i) => (i + 1) % TAGLINES.length);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [opacity]);

  return (
    <Animated.Text style={[styles.headerTagline, { opacity }]}>
      {TAGLINES[idx]}
    </Animated.Text>
  );
}

// ---------- Search ---------------------------------------------------------

function SearchBar({
  query,
  onChange,
}: {
  query: string;
  onChange: (s: string) => void;
}) {
  // Subtle pulse on focus — scale + shadow grow. We trigger it from the
  // Pressable wrapper since the input itself isn't focusable here (this
  // search bar punts to /categories on tap).
  const pulse = useRef(new Animated.Value(1)).current;
  const startPulse = () => {
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1.015,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Pressable
        style={({ pressed }) => [styles.searchWrap, pressed && { opacity: 0.95 }]}
        onPress={() => {
          tapLight();
          startPulse();
          router.push('/categories');
        }}
      >
        <Ionicons name="search" size={18} color={PALETTE.textWarm} />
        <TextInput
          value={query}
          onChangeText={onChange}
          placeholder="Search cleaners, skincare, scents..."
          placeholderTextColor={PALETTE.textSubtle}
          style={styles.searchInput}
          editable={false}
          pointerEvents="none"
        />
      </Pressable>
    </Animated.View>
  );
}

// ---------- Hero card ------------------------------------------------------

function HeroCard() {
  // Gentle "breathing" zoom on the background image — never more than 5%.
  // Loops forever; pause-friendly because it's transform-only.
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [breathe]);
  const imgScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.06] });

  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push({
          pathname: '/preferences',
          params: { id: WEEKLY_PICK.productId },
        });
      }}
      style={({ pressed }) => [
        styles.heroWrap,
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: imgScale }] }]}>
        <ImageBackground
          source={WEEKLY_PICK.image}
          style={styles.heroImg}
          imageStyle={styles.heroImgInner}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Top-down softening so headline + badge always read */}
      <LinearGradient
        colors={[
          'rgba(255,251,242,0.94)',
          'rgba(255,251,242,0.55)',
          'rgba(255,251,242,0)',
        ]}
        locations={[0, 0.45, 0.9]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 0.55 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.heroBody}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>PICK OF THE WEEK</Text>
        </View>
        <Text style={styles.heroTitle}>{WEEKLY_PICK.title}</Text>
        <Text style={styles.heroSub} numberOfLines={3}>
          {WEEKLY_PICK.blurb}
        </Text>
      </View>

      <View style={styles.heroCtaRow}>
        <View style={styles.heroCta}>
          <Text style={styles.heroCtaText}>Make Now</Text>
          <Ionicons name="arrow-forward" size={14} color={PALETTE.text} />
        </View>
      </View>
    </Pressable>
  );
}

// ---------- Chip row -------------------------------------------------------

function ChipRow() {
  // Staggered slide-in for the chips so they feel like they "settled" into
  // place rather than blinked.
  const items = useRef(INTENTS.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      60,
      items.map((v) =>
        Animated.spring(v, {
          toValue: 1,
          damping: 16,
          stiffness: 220,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [items]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {INTENTS.map((it, i) => {
        const v = items[i];
        const tY = v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
        return (
          <Animated.View
            key={it.key}
            style={{ opacity: v, transform: [{ translateY: tY }] }}
          >
            <Pressable
              onPress={() => {
                tapLight();
                router.push('/categories');
              }}
              style={({ pressed }) => [
                styles.chip,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <View style={[styles.chipIcon, { backgroundColor: it.bg }]}>
                <Ionicons name={it.icon} size={15} color={it.tint} />
              </View>
              <Text style={styles.chipLabel}>{it.label}</Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

// ---------- Section header -------------------------------------------------

function SectionHeader({
  title,
  caption,
  actionLabel,
  onAction,
}: {
  title: string;
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable
          hitSlop={10}
          onPress={() => {
            tapLight();
            onAction?.();
          }}
        >
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------- Styles ---------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 22, paddingBottom: SPC.lg },

  // -- Header -------------------------------------------------------------
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: SPC.sm,
    paddingBottom: SPC.lg,
    gap: SPC.md,
  },
  headerEyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '500',
    color: PALETTE.sageEyebrow,
    marginBottom: SPC.sm,
  },
  headerTitle: {
    fontSize: 44,
    lineHeight: 46,
    fontWeight: '800',
    color: PALETTE.text,
    letterSpacing: -1.4,
  },
  headerTagline: {
    marginTop: SPC.sm + 2,
    fontSize: 15,
    lineHeight: 20,
    color: PALETTE.textWarm,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    // Faux-glass: high-opacity white + cream-tinged border + soft shadow.
    // Swap to <BlurView/> when expo-blur is added.
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPC.sm,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  // -- Search -------------------------------------------------------------
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 58,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    marginTop: SPC.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: PALETTE.text,
    paddingVertical: 0,
    fontWeight: '500',
  },

  // -- Hero card ----------------------------------------------------------
  sectionGap: { height: SPC.xs },
  heroWrap: {
    marginTop: SPC.lg + SPC.xs,
    height: 420,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: PALETTE.surfaceWarm,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  heroImg: { width: '100%', height: '100%' },
  heroImgInner: { borderRadius: 34 },
  heroBody: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 28,
    paddingHorizontal: 28,
    gap: 14,
    maxWidth: '78%',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  heroBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: 2.2,
  },
  heroTitle: {
    fontSize: 44,
    lineHeight: 46,
    fontWeight: '800',
    color: PALETTE.text,
    letterSpacing: -1.4,
    marginTop: 2,
  },
  heroSub: {
    fontSize: 15,
    lineHeight: 21,
    color: PALETTE.text,
    fontWeight: '500',
    opacity: 0.85,
    maxWidth: '92%',
  },
  heroCtaRow: {
    position: 'absolute',
    bottom: 24,
    left: 28,
    right: 28,
    flexDirection: 'row',
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: 0.4,
  },

  // -- Section headers ---------------------------------------------------
  sectionHeader: {
    marginTop: SPC.xl + SPC.xs,
    marginBottom: SPC.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.5,
  },
  sectionCaption: {
    fontSize: 13,
    color: PALETTE.textWarm,
    marginTop: 3,
    fontWeight: '400',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.goldAccent,
    letterSpacing: 0.2,
  },

  // -- Chips -------------------------------------------------------------
  chipRow: { gap: 10, paddingRight: SPC.md, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 6,
    paddingRight: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  chipIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.text,
    letterSpacing: -0.1,
  },

  // -- Trending big cards ------------------------------------------------
  cardRow: { gap: 14, paddingRight: 14 },
  bigCard: {
    width: 230,
    borderRadius: 22,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  bigSwatch: {
    height: 158,
    position: 'relative',
    overflow: 'hidden',
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  trendingBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  trendingPulse: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#C26B5A',
  },
  trendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bigBody: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 4 },
  bigTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.2,
  },
  bigMeta: { fontSize: 11.5, color: PALETTE.textWarm },

  // -- Small cards (5-min, budget) ---------------------------------------
  smallRow: { gap: 12, paddingRight: 12 },
  smallCard: { width: 168, gap: SPC.sm },
  smallSwatch: {
    height: 138,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  smallTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.text,
    lineHeight: 16,
  },
  smallMeta: {
    fontSize: 11,
    color: PALETTE.sageDeep,
    fontWeight: '600',
    marginTop: -2,
  },
  timePill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  timePillText: { fontSize: 10.5, fontWeight: '700', color: PALETTE.text },
  costPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  costPillText: { fontSize: 10.5, fontWeight: '700' },

  // -- Seasonal grid -----------------------------------------------------
  seasonalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  seasonalCard: {
    width: '48.5%',
    borderRadius: 20,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    height: 84,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  seasonalCardWide: { width: '100%' },
  seasonalSwatch: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  seasonalIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  seasonalBody: { flex: 1, paddingLeft: 14, gap: 3 },
  seasonalTag: {
    fontSize: 9.5,
    letterSpacing: 1.1,
    fontWeight: '700',
    color: PALETTE.goldDeep,
  },
  seasonalTitle: { fontSize: 13.5, fontWeight: '700', color: PALETTE.text },

  // -- Personal list -----------------------------------------------------
  personalList: {
    backgroundColor: PALETTE.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  personalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderSoft,
  },
  personalSwatch: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  personalIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  personalReason: {
    fontSize: 10.5,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  personalTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.text,
    marginTop: 3,
    letterSpacing: -0.2,
  },
  personalMeta: { fontSize: 11.5, color: PALETTE.textWarm, marginTop: 2 },

  // -- Pantry card --------------------------------------------------------
  pantryCard: {
    marginTop: SPC.xl,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  pantryGradient: {
    padding: 24,
    gap: 8,
  },
  pantryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pantryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  pantryBadgeText: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  emojiRow: { flexDirection: 'row', gap: 2 },
  pantryItemEmoji: { fontSize: 22 },
  pantryTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  pantrySub: { fontSize: 13, color: PALETTE.textWarm, lineHeight: 18 },
  pantryCta: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: PALETTE.text,
  },
  pantryCtaText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // -- Premium card -------------------------------------------------------
  premiumWrap: {
    marginTop: SPC.lg,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  premiumCard: { padding: 24, gap: 8 },
  premiumBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  premiumBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.4,
  },
  premiumTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    marginTop: 10,
  },
  premiumSub: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
  },
  premiumStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  premiumStat: { flex: 1 },
  premiumStatValue: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  premiumStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },
  premiumStatDiv: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: 12,
  },
  premiumCta: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  premiumCtaText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    letterSpacing: 0.3,
  },

  cardPressed: { transform: [{ scale: 0.98 }] },
});

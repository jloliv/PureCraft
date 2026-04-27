import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
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
import { recipeIcon, RECIPE_ICON_BLEND } from '@/lib/recipe-icons';

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
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
};

const WEEKLY_PICK = {
  productId: 'citrus-countertop-cleaner',
  eyebrow: 'Pick of the Week',
  title: 'Glow Ritual',
  blurb: 'Citrus countertop cleaner with spa-level freshness',
  image: require('../assets/images/PureCraftHero2.png'),
};

type Intent = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; tint: string };

const INTENTS: Intent[] = [
  { key: 'save', label: 'Save Money', icon: 'cash-outline', tint: PALETTE.gold },
  { key: 'pet', label: 'Pet Safe', icon: 'paw-outline', tint: PALETTE.sageDeep },
  { key: 'baby', label: 'Baby Safe', icon: 'happy-outline', tint: '#9C7A4F' },
  { key: 'allergy', label: 'Allergy Aware', icon: 'medkit-outline', tint: '#6F5FA3' },
  { key: 'fragrance-free', label: 'Fragrance Free', icon: 'leaf-outline', tint: PALETTE.sageDeep },
  { key: 'natural', label: 'All Natural', icon: 'flower-outline', tint: '#B86F44' },
];

const TRENDING = [
  { id: 'bathroom-cleaner', stat: '1.2k made this week' },
  { id: 'linen-spray', stat: '880 made this week' },
  { id: 'kitchen-spray', stat: '760 made this week' },
  { id: 'sugar-scrub', stat: '540 made this week' },
];

const QUICK = ['glass-cleaner', 'laundry-booster', 'bathroom-cleaner', 'room-spray'];

function recipeCostUsd(productId: string): number {
  const r = RECIPES[productId];
  if (!r) return 0;
  return r.ingredients
    .filter((i) => !i.haveIt)
    .reduce((sum, i) => sum + (i.storePriceUsd ?? 0), 0);
}

const BUDGET_IDS = ['bathroom-cleaner', 'glass-cleaner', 'laundry-booster', 'kitchen-spray'];

const SEASONAL = [
  { id: 'linen-spray', tag: 'Spring linen refresh' },
  { id: 'room-spray', tag: 'Open-window mist' },
  { id: 'glass-cleaner', tag: 'Daylight clean' },
  { id: 'floor-cleaner', tag: 'Pollen reset' },
];

const PERSONAL = [
  { id: 'kitchen-spray', reason: 'Because you cook often' },
  { id: 'sugar-scrub', reason: 'Matches your beauty profile' },
  { id: 'floor-cleaner', reason: 'Pet-safe pick' },
];

const PANTRY_STATS = {
  ingredientCount: 7,
  recipesAvailable: 4,
  topItems: ['💧', '🧂', '🍋', '🫧', '🌱'],
};

export default function Discover() {
  const { currency } = useCurrency();
  const [query, setQuery] = useState('');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>For you · today</Text>
            <Text style={styles.headerTitle}>Discover</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter"
            onPress={() => {}}
            style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="options-outline" size={18} color={PALETTE.text} />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.searchWrap, pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/categories')}
        >
          <Ionicons name="search" size={18} color={PALETTE.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search recipes, ingredients, scents…"
            placeholderTextColor={PALETTE.textSubtle}
            style={styles.searchInput}
            editable={false}
            pointerEvents="none"
          />
          <View style={styles.searchKbd}>
            <Ionicons name="mic-outline" size={16} color={PALETTE.sageDeep} />
          </View>
        </Pressable>

        <WeeklyBanner />

        <SectionHeader title="What matters this week" caption="One tap to filter" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.intentRow}
        >
          {INTENTS.map((it) => (
            <Pressable
              key={it.key}
              onPress={() => router.push('/categories')}
              style={({ pressed }) => [styles.intentChip, pressed && { transform: [{ scale: 0.97 }] }]}
            >
              <View style={[styles.intentIcon, { backgroundColor: PALETTE.sageSoft }]}>
                <Ionicons name={it.icon} size={16} color={it.tint} />
              </View>
              <Text style={styles.intentLabel}>{it.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

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
          snapToInterval={232}
        >
          {TRENDING.map((t) => {
            const p = findProduct(t.id);
            return (
              <Pressable
                key={t.id}
                onPress={() => router.push({ pathname: '/preferences', params: { id: t.id } })}
                style={({ pressed }) => [styles.bigCard, pressed && styles.cardPressed]}
              >
                <View style={[styles.bigSwatch, { backgroundColor: p.swatch }]}>
                  <View style={styles.iconLayer}>
                    <Image
                      source={recipeIcon(t.id)}
                      testID="pc-recipe-icon"
                      style={[styles.cardIcon, RECIPE_ICON_BLEND]}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.trendingBadge}>
                    <View style={styles.trendingPulse} />
                    <Text style={styles.trendingBadgeText}>Trending</Text>
                  </View>
                </View>
                <View style={styles.bigBody}>
                  <Text style={styles.bigTitle} numberOfLines={1}>{p.title}</Text>
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
                onPress={() => router.push({ pathname: '/preferences', params: { id } })}
                style={({ pressed }) => [styles.smallCard, pressed && styles.cardPressed]}
              >
                <View style={[styles.smallSwatch, { backgroundColor: p.swatch }]}>
                  <View style={styles.iconLayer}>
                    <Image
                      source={recipeIcon(id)}
                      testID="pc-recipe-icon"
                      style={[styles.cardIcon, RECIPE_ICON_BLEND]}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.timePill}>
                    <Ionicons name="time-outline" size={11} color={PALETTE.text} />
                    <Text style={styles.timePillText}>{p.time}</Text>
                  </View>
                </View>
                <Text style={styles.smallTitle} numberOfLines={2}>{p.title}</Text>
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
                onPress={() => router.push({ pathname: '/preferences', params: { id } })}
                style={({ pressed }) => [styles.smallCard, pressed && styles.cardPressed]}
              >
                <View style={[styles.smallSwatch, { backgroundColor: p.swatch }]}>
                  <View style={styles.iconLayer}>
                    <Image
                      source={recipeIcon(id)}
                      testID="pc-recipe-icon"
                      style={[styles.cardIcon, RECIPE_ICON_BLEND]}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={[styles.costPill, { borderColor: p.accent }]}>
                    <Text style={[styles.costPillText, { color: p.accent }]}>
                      {formatMoney(cost, { currency })} to make
                    </Text>
                  </View>
                </View>
                <Text style={styles.smallTitle} numberOfLines={2}>{p.title}</Text>
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
                onPress={() => router.push({ pathname: '/preferences', params: { id: s.id } })}
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
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.seasonalBody}>
                  <Text style={styles.seasonalTag}>{s.tag.toUpperCase()}</Text>
                  <Text style={styles.seasonalTitle} numberOfLines={1}>{p.title}</Text>
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
                onPress={() => router.push({ pathname: '/preferences', params: { id: item.id } })}
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
                    resizeMode="contain"
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
          onPress={() => router.push('/categories')}
          style={({ pressed }) => [styles.pantryCard, pressed && { opacity: 0.96 }]}
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
                  <Text key={idx} style={[styles.pantryItemEmoji, { transform: [{ rotate: `${idx * 4 - 4}deg` }] }]}>
                    {e}
                  </Text>
                ))}
              </View>
            </View>

            <Text style={styles.pantryTitle}>
              You have {PANTRY_STATS.ingredientCount} ingredients.{`\n`}Make {PANTRY_STATS.recipesAvailable} recipes right now.
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
          onPress={() => router.push('/premium')}
          style={({ pressed }) => [styles.premiumWrap, pressed && { opacity: 0.95 }]}
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
            <Text style={styles.premiumTitle}>Unlock 120+ premium{`\n`}recipes & family profiles</Text>
            <Text style={styles.premiumSub}>
              Allergy-aware filters, smart shopping planner, expert rituals.
            </Text>
            <View style={styles.premiumStats}>
              <View style={styles.premiumStat}>
                <Text style={styles.premiumStatValue}>120+</Text>
                <Text style={styles.premiumStatLabel}>premium recipes</Text>
              </View>
              <View style={styles.premiumStatDiv} />
              <View style={styles.premiumStat}>
                <Text style={styles.premiumStatValue}>{formatMoney(420, { currency, round: true })}+</Text>
                <Text style={styles.premiumStatLabel}>saved / yr avg.</Text>
              </View>
            </View>
            <View style={styles.premiumCta}>
              <Text style={styles.premiumCtaText}>Try free for 7 days</Text>
              <Ionicons name="arrow-forward" size={14} color={PALETTE.sageDeep} />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={{ height: 112 }} />
      </ScrollView>

      <MakeNav active="discover" />
    </SafeAreaView>
  );
}

function WeeklyBanner() {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/preferences', params: { id: WEEKLY_PICK.productId } })}
      style={({ pressed }) => [styles.weeklyWrap, pressed && { opacity: 0.96 }]}
    >
      <ImageBackground
        source={WEEKLY_PICK.image}
        style={styles.weekly}
        imageStyle={styles.weeklyImg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.7)']}
          locations={[0.25, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <View style={styles.weeklyTop}>
          <View style={styles.weeklyBadge}>
            <Text style={styles.weeklyBadgeText}>{WEEKLY_PICK.eyebrow}</Text>
          </View>
          <Text style={styles.weeklyTitle}>{WEEKLY_PICK.title}</Text>
          <Text style={styles.weeklySub}>{WEEKLY_PICK.blurb}</Text>
        </View>

        <View style={styles.weeklyCta}>
          <Text style={styles.weeklyCtaText}>Make Now</Text>
          <Ionicons name="arrow-forward" size={13} color={PALETTE.text} />
        </View>
      </ImageBackground>
    </Pressable>
  );
}

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
        <Pressable hitSlop={8} onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 14,
  },
  headerEyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '600',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.7,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.text,
    paddingVertical: 0,
  },
  searchKbd: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weeklyWrap: {
    marginTop: 24,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: PALETTE.surfaceWarm,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  weekly: {
    width: '100%',
    height: 360,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weeklyImg: { borderRadius: 32 },
  weeklyTop: {
    alignItems: 'flex-start',
    gap: 14,
    maxWidth: '78%',
  },
  weeklyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  weeklyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.text,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  weeklyTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  weeklySub: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '400',
  },
  weeklyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  weeklyCtaText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: 0.4,
  },

  sectionHeader: {
    marginTop: 30,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  sectionCaption: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  sectionAction: { fontSize: 12.5, fontWeight: '600', color: PALETTE.goldDeep },

  intentRow: { gap: 8, paddingRight: 16 },
  intentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  intentIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentLabel: { fontSize: 12.5, fontWeight: '600', color: PALETTE.text },

  cardRow: { gap: 14, paddingRight: 14 },
  bigCard: {
    width: 218,
    borderRadius: 20,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  bigSwatch: {
    height: 150,
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  bigEmoji: { fontSize: 38 },
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
    width: '82%',
    height: '82%',
  },
  trendingBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFFE6',
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
  bigBody: { padding: 14, gap: 4 },
  bigTitle: { fontSize: 14, fontWeight: '700', color: PALETTE.text },
  bigMeta: { fontSize: 11.5, color: PALETTE.textMuted },

  smallRow: { gap: 12, paddingRight: 12 },
  smallCard: {
    width: 160,
    gap: 8,
  },
  smallSwatch: {
    height: 130,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  smallEmoji: { fontSize: 30 },
  smallTitle: { fontSize: 13, fontWeight: '700', color: PALETTE.text, lineHeight: 16 },
  smallMeta: { fontSize: 11, color: PALETTE.sageDeep, fontWeight: '600', marginTop: -2 },
  timePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFFE6',
  },
  timePillText: { fontSize: 10.5, fontWeight: '700', color: PALETTE.text },
  costPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#FFFFFFCC',
  },
  costPillText: { fontSize: 10.5, fontWeight: '700' },

  seasonalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  seasonalCard: {
    width: '48.5%',
    borderRadius: 18,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    height: 78,
  },
  seasonalCardWide: { width: '100%' },
  seasonalSwatch: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  seasonalEmoji: { fontSize: 30 },
  seasonalIcon: {
    width: '82%',
    height: '82%',
  },
  seasonalBody: { flex: 1, paddingLeft: 12, gap: 2 },
  seasonalTag: {
    fontSize: 9.5,
    letterSpacing: 1.1,
    fontWeight: '700',
    color: PALETTE.goldDeep,
  },
  seasonalTitle: { fontSize: 13, fontWeight: '700', color: PALETTE.text },

  personalList: {
    backgroundColor: PALETTE.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
  },
  personalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  personalSwatch: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  personalEmoji: { fontSize: 26 },
  personalIcon: {
    width: '82%',
    height: '82%',
  },
  personalReason: {
    fontSize: 10.5,
    letterSpacing: 1,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  personalTitle: { fontSize: 14, fontWeight: '700', color: PALETTE.text, marginTop: 2 },
  personalMeta: { fontSize: 11.5, color: PALETTE.textMuted, marginTop: 2 },

  pantryCard: {
    marginTop: 30,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  pantryGradient: {
    padding: 22,
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
    backgroundColor: '#FFFFFFCC',
  },
  pantryBadgeText: {
    fontSize: 10,
    letterSpacing: 1.2,
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
    letterSpacing: -0.4,
    marginTop: 6,
  },
  pantrySub: { fontSize: 12.5, color: PALETTE.textMuted, lineHeight: 17 },
  pantryCta: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PALETTE.text,
  },
  pantryCtaText: { fontSize: 12.5, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  premiumWrap: {
    marginTop: 18,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  premiumCard: { padding: 22, gap: 8 },
  premiumBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF24',
    borderWidth: 1,
    borderColor: '#FFFFFF55',
  },
  premiumBadgeText: { fontSize: 10.5, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1.2 },
  premiumTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  premiumSub: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#FFFFFFCC',
  },
  premiumStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF18',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF35',
  },
  premiumStat: { flex: 1 },
  premiumStatValue: { fontSize: 19, fontWeight: '700', color: '#FFFFFF' },
  premiumStatLabel: { fontSize: 11, color: '#FFFFFFC0', marginTop: 2 },
  premiumStatDiv: { width: 1, backgroundColor: '#FFFFFF35', marginHorizontal: 12 },
  premiumCta: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  premiumCtaText: { fontSize: 12.5, fontWeight: '700', color: PALETTE.sageDeep, letterSpacing: 0.3 },

  cardPressed: { transform: [{ scale: 0.98 }] },
});

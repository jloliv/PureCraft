import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MakeNav } from '@/components/make-nav';
import { SavingsDashboard } from '@/components/savings-dashboard';
import { formatMoney, useCurrency } from '@/constants/currency';
import { PRODUCTS, type Product } from '@/constants/products';
import { useAllRecipes } from '@/constants/recipes-remote';
import { useAuth } from '@/lib/auth';
import { recipeIcon as iconFor, RECIPE_ICON_BLEND } from '@/lib/recipe-icons';
import { useRecentRecipes } from '@/lib/recent-recipes';
import { useSavedRecipes } from '@/lib/saved-recipes';

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
  rose: '#C26B5A',
};

type SavedItem = {
  product: Product;
  madeCount: number;
  lastMade: string;
  totalSavedUsd: number;
  premium?: boolean;
  custom?: boolean;
};

// --- Live → SavedItem adapter ------------------------------------------------
//
// `saved_recipes` rows reference recipe IDs. For hero recipes (in PRODUCTS)
// we wire in the full Product. For AI/user-generated recipes that don't
// exist in PRODUCTS, we synthesize a minimal Product-shape from the
// remote recipe row so the same renderer works across both sources.

function timeAgo(iso: string | null): string {
  if (!iso) return 'Just saved';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

// Fallback hero data so the "empty state" demo still feels alive when the
// user hasn't saved anything yet.
const DEMO_FALLBACK: SavedItem[] = [
  { product: PRODUCTS.find((p) => p.id === 'bathroom-cleaner')!, madeCount: 4, lastMade: '2 days ago', totalSavedUsd: 12.80 },
  { product: PRODUCTS.find((p) => p.id === 'kitchen-spray')!, madeCount: 3, lastMade: 'Last week', totalSavedUsd: 11.40 },
  { product: PRODUCTS.find((p) => p.id === 'sugar-scrub')!, madeCount: 2, lastMade: '3 weeks ago', totalSavedUsd: 17.00, premium: true },
  { product: PRODUCTS.find((p) => p.id === 'linen-spray')!, madeCount: 2, lastMade: 'Last month', totalSavedUsd: 10.20 },
  { product: PRODUCTS.find((p) => p.id === 'body-butter')!, madeCount: 1, lastMade: 'Last month', totalSavedUsd: 11.00, premium: true, custom: true },
  { product: PRODUCTS.find((p) => p.id === 'glass-cleaner')!, madeCount: 1, lastMade: '2 months ago', totalSavedUsd: 2.40 },
];

const FILTERS = ['All', 'Favorites', 'Cleaning', 'Beauty', 'Home', 'Custom', 'Premium'] as const;
type Filter = (typeof FILTERS)[number];

const COLLECTIONS = [
  {
    key: 'spring-reset',
    name: 'Spring Reset',
    count: 8,
    sub: 'Pollen, dust, fresh air',
    accent: '#E4EDE5',
    accentDeep: '#7E8F75',
    icon: 'flower-outline' as const,
  },
  {
    key: 'weekly-staples',
    name: 'Weekly Staples',
    count: 12,
    sub: 'The non-negotiables',
    accent: '#F7F2E7',
    accentDeep: '#A98A4D',
    icon: 'leaf-outline' as const,
  },
  {
    key: 'self-care',
    name: 'Self Care Sundays',
    count: 6,
    sub: 'Slow routines',
    accent: '#F1ECE0',
    accentDeep: '#9C7A4F',
    icon: 'sparkles-outline' as const,
  },
  {
    key: 'baby-safe',
    name: 'Baby Safe Home',
    count: 5,
    sub: 'Tiny-hands approved',
    accent: '#EAF1F4',
    accentDeep: '#4F7186',
    icon: 'happy-outline' as const,
  },
];

export default function Saved() {
  const { currency } = useCurrency();
  const [filter, setFilter] = useState<Filter>('All');
  const { user } = useAuth();
  const { saved: savedMap } = useSavedRecipes();
  const allRecipes = useAllRecipes();

  // Build live SavedItem[] from the joined saved_recipes × recipes data.
  // Recipes that map cleanly to a hero Product use the rich PRODUCTS row;
  // others (AI / user-generated) use a synthetic minimal Product.
  const liveSaved = useMemo<SavedItem[]>(() => {
    const out: SavedItem[] = [];
    for (const [recipeId, save] of savedMap) {
      const product =
        PRODUCTS.find((p) => p.id === recipeId) ??
        (() => {
          const recipe = allRecipes.find((r) => r.id === recipeId);
          if (!recipe) return null;
          // Synthesize a Product shape so the existing card renderer works.
          // The 'group' has to be one of cleaning|beauty|home so filters land.
          const group: Product['group'] =
            recipe.categoryKey === 'cleaning' || recipe.categoryKey === 'laundry'
              ? 'cleaning'
              : recipe.categoryKey === 'beauty-skincare' ||
                  recipe.categoryKey === 'hair-care'
                ? 'beauty'
                : 'home';
          return {
            id: recipe.id,
            title: recipe.title,
            group,
            time: recipe.time,
            difficulty: recipe.difficulty,
            tags: recipe.tags,
            blurb: recipe.title,
            // Placeholder visuals — eventually we render recipeIcon by id.
            swatch: '#F1ECE0',
            colorAccent: '#A8B8A0',
            accent: '#A8B8A0',
            emoji: '✨',
            savingsUsd: 0,
            storeBoughtUsd: 0,
          } as unknown as Product;
        })();
      if (!product) continue;
      out.push({
        product,
        madeCount: save.made_count,
        lastMade: timeAgo(save.last_made ?? save.saved_at),
        totalSavedUsd: (product.savingsUsd ?? 0) * Math.max(1, save.made_count),
        custom: !PRODUCTS.find((p) => p.id === recipeId),
      });
    }
    return out.sort((a, b) => b.madeCount - a.madeCount);
  }, [savedMap, allRecipes]);

  // Show demo fallback when signed out OR when signed in but no saves yet
  // (so the screen has visual life). Once they save something real, demo
  // disappears.
  const baseList = !user || liveSaved.length === 0 ? DEMO_FALLBACK : liveSaved;

  const filtered = useMemo(() => {
    if (filter === 'All') return baseList;
    if (filter === 'Favorites') return baseList.filter((s) => s.madeCount >= 2);
    if (filter === 'Custom') return baseList.filter((s) => s.custom);
    if (filter === 'Premium') return baseList.filter((s) => s.premium);
    const groupKey = filter.toLowerCase();
    return baseList.filter((s) => s.product.group === groupKey);
  }, [filter, baseList]);

  const recent = [...baseList].slice(0, 5);
  // Last-10-viewed list, persisted via AsyncStorage. Falls back to the
  // saved-fallback list when there's no view history yet.
  const recentIds = useRecentRecipes();
  const recentlyViewed = useMemo(() => {
    if (recentIds.length === 0) return recent;
    return recentIds
      .slice(0, 5)
      .map((id) => {
        const product = PRODUCTS.find((p) => p.id === id);
        if (!product) return null;
        // Reuse the SavedItem shape so the existing card renderer works.
        return {
          product,
          madeCount: 0,
          lastMade: 'Recently viewed',
          totalSavedUsd: product.savingsUsd ?? 0,
        };
      })
      .filter((x): x is SavedItem => x !== null);
  }, [recentIds, recent]);
  const isEmpty = filtered.length === 0;
  const CONTINUE_MAKING = baseList[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>Library</Text>
            <Text style={styles.headerTitle}>Saved</Text>
            <Text style={styles.headerSub}>Your curated PureCraft collection</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search saved"
              onPress={() => {}}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="search" size={18} color={PALETTE.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sort"
              onPress={() => {}}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="swap-vertical-outline" size={18} color={PALETTE.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={({ pressed }) => [
                  styles.chip,
                  isActive && styles.chipActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SavingsDashboard onPressBreakdown={() => {}} />

        <ContinueMakingCard item={CONTINUE_MAKING} currencySymbol={currency.symbol} />

        <SectionHeader
          title="Your collections"
          caption="Group recipes by routine"
          actionLabel="New folder"
          onAction={() => {}}
        />
        <View style={styles.collectionsGrid}>
          {COLLECTIONS.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => {}}
              style={({ pressed }) => [
                styles.collectionCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.collectionStack, { backgroundColor: c.accent }]}>
                <View style={[styles.stackBack, { backgroundColor: '#FFFFFF80' }]} />
                <View style={[styles.stackMid, { backgroundColor: '#FFFFFFB0' }]} />
                <View style={[styles.stackFront, { backgroundColor: '#FFFFFF' }]}>
                  <Ionicons name={c.icon} size={22} color={c.accentDeep} />
                </View>
              </View>
              <View style={styles.collectionBody}>
                <Text style={styles.collectionName}>{c.name}</Text>
                <Text style={styles.collectionMeta}>
                  {c.count} recipes · {c.sub}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <SectionHeader
          title="Recently viewed"
          caption={
            recentIds.length > 0
              ? `Your last ${Math.min(recentIds.length, 5)}`
              : 'Your last 5'
          }
          actionLabel="View all"
          onAction={() => setFilter('All')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentRow}
        >
          {recentlyViewed.map((s) => (
            <Pressable
              key={s.product.id}
              onPress={() => router.push({ pathname: '/result', params: { id: s.product.id } })}
              style={({ pressed }) => [styles.recentCard, pressed && styles.cardPressed]}
            >
              <View style={[styles.recentSwatch, { backgroundColor: s.product.swatch }]}>
                <View style={styles.iconLayer}>
                  <Image
                    source={iconFor(s.product.id)}
                    testID="pc-recipe-icon"
                    style={[styles.recentIcon, RECIPE_ICON_BLEND]}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.heartChip}>
                  <Ionicons name="heart" size={10} color={PALETTE.rose} />
                </View>
              </View>
              <Text style={styles.recentTitle} numberOfLines={1}>
                {s.product.title}
              </Text>
              <Text style={styles.recentMeta}>{s.lastMade}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader
          title={filter === 'All' ? 'All saved' : filter}
          caption={`${filtered.length} ${filtered.length === 1 ? 'recipe' : 'recipes'}`}
        />

        {isEmpty ? (
          <EmptyState onBrowse={() => router.push('/discover')} />
        ) : (
          <View style={styles.grid}>
            {filtered.map((s) => (
              <SavedCard
                key={s.product.id}
                item={s}
                currencySymbol={currency.symbol}
              />
            ))}
          </View>
        )}

        <View style={{ height: 112 }} />
      </ScrollView>

      <MakeNav active="saved" />
    </SafeAreaView>
  );
}

function ContinueMakingCard({
  item,
  currencySymbol,
}: {
  item: SavedItem;
  currencySymbol: string;
}) {
  const progress = 0.6;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/result', params: { id: item.product.id } })}
      style={({ pressed }) => [styles.continueWrap, pressed && { opacity: 0.96 }]}
    >
      <LinearGradient
        colors={['#EFE7D2', '#F7F2E7', '#E4EDE5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.continueCard}
      >
        <View style={styles.continueLeft}>
          <View style={styles.continueBadge}>
            <View style={styles.continuePulse} />
            <Text style={styles.continueBadgeText}>Continue making</Text>
          </View>
          <Text style={styles.continueTitle}>{item.product.title}</Text>
          <Text style={styles.continueMeta}>
            Step 3 of 5 · {item.product.time}
          </Text>
          <View style={styles.continueProgressTrack}>
            <View style={[styles.continueProgressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.continueCta}>
            <Text style={styles.continueCtaText}>Resume</Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </View>
        </View>
        <View style={[styles.continueSwatch, { backgroundColor: item.product.swatch }]}>
          <View style={styles.iconLayer}>
            <Image
              source={iconFor(item.product.id)}
                    testID="pc-recipe-icon"
              style={[styles.continueIcon, RECIPE_ICON_BLEND]}
              resizeMode="contain"
            />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function SavedCard({
  item,
  currencySymbol: _,
}: {
  item: SavedItem;
  currencySymbol: string;
}) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/result', params: { id: item.product.id } })}
      style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
    >
      <View style={[styles.gridSwatch, { backgroundColor: item.product.swatch }]}>
        <View style={styles.iconLayer}>
          <Image
            source={iconFor(item.product.id)}
                    testID="pc-recipe-icon"
            style={[styles.gridIcon, RECIPE_ICON_BLEND]}
            resizeMode="contain"
          />
        </View>
        <View style={styles.gridTopRow}>
          {item.premium ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="sparkles" size={10} color={PALETTE.goldDeep} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          ) : (
            <View style={{ width: 1 }} />
          )}
          <View style={styles.heartBadge}>
            <Ionicons name="heart" size={11} color={PALETTE.rose} />
          </View>
        </View>
      </View>
      <View style={styles.gridBody}>
        <Text style={styles.gridTitle} numberOfLines={1}>
          {item.product.title}
        </Text>
        <Text style={styles.gridMeta}>
          Made {item.madeCount}× · {item.lastMade}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}>
        <Ionicons name="bookmark-outline" size={26} color={PALETTE.sageDeep} />
      </View>
      <Text style={styles.emptyTitle}>Nothing saved here yet</Text>
      <Text style={styles.emptyBody}>
        Tap the heart on any recipe and it lands here.{`\n`}Build a library you&apos;ll actually use.
      </Text>
      <Pressable
        onPress={onBrowse}
        style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.92 }]}
      >
        <Text style={styles.emptyCtaText}>Browse Discover</Text>
        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
      </Pressable>
    </View>
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
    paddingBottom: 16,
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
  headerSub: { fontSize: 13, color: PALETTE.textMuted, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterRow: { gap: 8, paddingRight: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipActive: { backgroundColor: PALETTE.sageDeep, borderColor: PALETTE.sageDeep },
  chipText: { fontSize: 12.5, fontWeight: '600', color: PALETTE.text },
  chipTextActive: { color: '#FFFFFF' },

  continueWrap: {
    marginTop: 18,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    padding: 18,
  },
  continueLeft: { flex: 1, gap: 4 },
  continueBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFFCC',
  },
  continuePulse: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  continueBadgeText: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: PALETTE.text,
    textTransform: 'uppercase',
  },
  continueTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.4,
    marginTop: 6,
  },
  continueMeta: { fontSize: 12, color: PALETTE.textMuted, marginTop: 2 },
  continueProgressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFFAA',
    marginTop: 10,
    overflow: 'hidden',
  },
  continueProgressFill: { height: '100%', backgroundColor: PALETTE.sageDeep, borderRadius: 999 },
  continueCta: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PALETTE.text,
  },
  continueCtaText: { fontSize: 11.5, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.4 },
  continueSwatch: {
    width: 96,
    height: 96,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    position: 'relative',
  },
  continueEmoji: { fontSize: 42 },
  continueIcon: {
    width: '82%',
    height: '82%',
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

  sectionHeader: {
    marginTop: 30,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  sectionCaption: { fontSize: 12, color: PALETTE.textMuted, marginTop: 2 },
  sectionAction: { fontSize: 12.5, fontWeight: '600', color: PALETTE.goldDeep },

  collectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  collectionCard: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  collectionStack: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stackBack: {
    position: 'absolute',
    width: 64,
    height: 78,
    borderRadius: 14,
    transform: [{ rotate: '-7deg' }, { translateX: -10 }, { translateY: 4 }],
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  stackMid: {
    position: 'absolute',
    width: 64,
    height: 78,
    borderRadius: 14,
    transform: [{ rotate: '5deg' }, { translateX: 8 }, { translateY: 2 }],
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  stackFront: {
    width: 64,
    height: 78,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  collectionBody: { padding: 14, gap: 2 },
  collectionName: { fontSize: 14, fontWeight: '700', color: PALETTE.text },
  collectionMeta: { fontSize: 11.5, color: PALETTE.textMuted },

  recentRow: { gap: 12, paddingRight: 12 },
  recentCard: { width: 140, gap: 8 },
  recentSwatch: {
    height: 130,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    position: 'relative',
    overflow: 'hidden',
  },
  recentEmoji: { fontSize: 36 },
  recentIcon: {
    width: '82%',
    height: '82%',
  },
  heartChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  recentTitle: { fontSize: 12.5, fontWeight: '700', color: PALETTE.text },
  recentMeta: { fontSize: 11, color: PALETTE.textMuted, marginTop: -2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  gridSwatch: {
    height: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  gridTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  gridEmoji: { fontSize: 38, alignSelf: 'flex-start' },
  gridIcon: {
    width: '82%',
    height: '82%',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FFFFFFE6',
    borderWidth: 1,
    borderColor: PALETTE.creamDeep,
  },
  premiumBadgeText: {
    fontSize: 9,
    letterSpacing: 0.7,
    fontWeight: '700',
    color: PALETTE.goldDeep,
    textTransform: 'uppercase',
  },
  heartBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  gridBody: { padding: 12, gap: 4 },
  gridTitle: { fontSize: 13.5, fontWeight: '700', color: PALETTE.text },
  gridMeta: { fontSize: 11, color: PALETTE.textMuted },

  empty: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 12,
    gap: 12,
  },
  emptyMark: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.sage,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.3,
    marginTop: 6,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
    color: PALETTE.textMuted,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  emptyCtaText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  cardPressed: { transform: [{ scale: 0.98 }] },
});

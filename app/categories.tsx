import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Drop your photo at assets/images/sugar-scrub-hero.jpg, then change this
// require to point at it. Salts gif is a stand-in until then.
const BEAUTY_HERO = require('../assets/images/PureCraftSalts.gif');

import { formatMoney, useCurrency } from '@/constants/currency';
import { findProduct } from '@/constants/products';
import {
  RECIPE_CATEGORIES,
  type RecipeCategoryKey,
  categoryByKey,
} from '@/constants/recipe-categories';
import { type Recipe, recipeSavingsUsd, searchRecipes } from '@/constants/recipes';
import { useAllRecipes } from '@/constants/recipes-remote';
import { recipeIcon } from '@/lib/recipe-icons';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

type FilterKey = 'all' | RecipeCategoryKey;

const CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  ...RECIPE_CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
];

type TimeBucket = 'under-5' | '5-10' | '15-plus';
type TypeOption = 'scrub' | 'mask' | 'oil' | 'balm';

type SheetFilters = {
  time: TimeBucket | null;
  familySafe: boolean;
  type: TypeOption | null;
};

const EMPTY_FILTERS: SheetFilters = { time: null, familySafe: false, type: null };

const TIME_OPTIONS: { key: TimeBucket; label: string }[] = [
  { key: 'under-5', label: 'Under 5 min' },
  { key: '5-10', label: '5–10 min' },
  { key: '15-plus', label: '15+ min' },
];

const TYPE_OPTIONS: { key: TypeOption; label: string }[] = [
  { key: 'scrub', label: 'Scrub' },
  { key: 'mask', label: 'Mask' },
  { key: 'oil', label: 'Oil' },
  { key: 'balm', label: 'Balm' },
];

function recipeMinutes(time: string): number {
  const m = time.match(/\d+/);
  return m ? Number(m[0]) : 0;
}

function recipeMatchesType(r: Recipe, t: TypeOption): boolean {
  const haystack = (r.title + ' ' + r.tags.join(' ')).toLowerCase();
  return haystack.includes(t);
}

function countActive(f: SheetFilters): number {
  return (f.time ? 1 : 0) + (f.familySafe ? 1 : 0) + (f.type ? 1 : 0);
}

export default function Categories() {
  const { currency } = useCurrency();
  const params = useLocalSearchParams<{
    category?: string;
    safeForKids?: string;
    tag?: string;
  }>();

  const initialCategory =
    typeof params.category === 'string' && params.category ? params.category : 'all';
  const safeForKidsParam = params.safeForKids === 'true';
  const tagParam = typeof params.tag === 'string' ? params.tag : '';

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>(initialCategory as FilterKey);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDraft, setSheetDraft] = useState<SheetFilters>(EMPTY_FILTERS);
  const [sheetApplied, setSheetApplied] = useState<SheetFilters>(EMPTY_FILTERS);
  const allRecipes = useAllRecipes();

  const activeSheetCount = countActive(sheetApplied);

  const filtered = useMemo(() => {
    let list: Recipe[] = allRecipes;

    if (filter !== 'all') {
      list = list.filter((r) => r.categoryKey === filter);
    }
    if (safeForKidsParam) {
      list = list.filter((r) => r.safeForKids);
    }
    if (tagParam) {
      const t = tagParam.toLowerCase();
      list = list.filter((r) => r.tags.some((tag) => tag.toLowerCase().includes(t)));
    }
    if (query.trim()) {
      list = searchRecipes(query, list);
    }

    if (sheetApplied.time) {
      list = list.filter((r) => {
        const m = recipeMinutes(r.time);
        if (sheetApplied.time === 'under-5') return m > 0 && m < 5;
        if (sheetApplied.time === '5-10') return m >= 5 && m <= 10;
        return m >= 15;
      });
    }
    if (sheetApplied.familySafe) {
      list = list.filter((r) => r.safeForKids);
    }
    if (sheetApplied.type) {
      list = list.filter((r) => recipeMatchesType(r, sheetApplied.type!));
    }

    return list;
  }, [allRecipes, filter, safeForKidsParam, tagParam, query, sheetApplied]);

  const grouped = useMemo(() => {
    if (filter !== 'all') {
      const cat = categoryByKey(filter);
      return [
        {
          key: filter,
          label: cat?.label ?? 'Recipes',
          caption: cat?.description ?? '',
          items: filtered,
        },
      ].filter((g) => g.items.length > 0);
    }
    return RECIPE_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      caption: c.description,
      items: filtered.filter((r) => r.categoryKey === c.key),
    })).filter((g) => g.items.length > 0);
  }, [filter, filtered]);

  const headline =
    filter === 'all'
      ? 'Make something'
      : categoryByKey(filter)?.label ?? 'Recipes';
  const hasSubFilter = safeForKidsParam || !!tagParam || !!query.trim();
  const headlineCaption =
    filter === 'all' && !hasSubFilter
      ? `${allRecipes.length} pure recipes ready to mix`
      : `${filtered.length} ${filtered.length === 1 ? 'recipe' : 'recipes'}`;

  const activeFilterPill =
    safeForKidsParam || tagParam
      ? safeForKidsParam
        ? 'Family-safe only'
        : `Tag: ${tagParam}`
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topTitle}>{headline}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter recipes"
          onPress={() => {
            setSheetDraft(sheetApplied);
            setSheetOpen(true);
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="options-outline" size={18} color={Colors.light.text} />
          {activeSheetCount > 0 ? (
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>{activeSheetCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {filter === 'beauty-skincare' ? (
          <View style={styles.hero}>
            <Image source={BEAUTY_HERO} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.18)']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>
        ) : null}

        <Text style={styles.sub}>{headlineCaption}</Text>

        {activeFilterPill ? (
          <View style={styles.activePill}>
            <Ionicons
              name={safeForKidsParam ? 'shield-checkmark' : 'pricetag'}
              size={11}
              color={Colors.light.sageDeep}
            />
            <Text style={styles.activePillText}>{activeFilterPill}</Text>
          </View>
        ) : null}

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.light.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or ingredient"
            placeholderTextColor={Colors.light.textSubtle}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query ? (
            <Pressable hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CHIPS.map((c) => {
            const isActive = filter === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setFilter(c.key)}
                style={({ pressed }) => [
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {grouped.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No recipes match your filters</Text>
            <Text style={styles.emptyCaption}>
              {activeSheetCount > 0
                ? 'Try clearing a filter or two.'
                : 'Try a different keyword or category.'}
            </Text>
            {activeSheetCount > 0 ? (
              <Pressable
                onPress={() => setSheetApplied(EMPTY_FILTERS)}
                style={({ pressed }) => [
                  styles.emptyClear,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.emptyClearText}>Clear all filters</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {grouped.map((g) => (
          <View key={g.key} style={styles.groupBlock}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupLabel}>{g.label}</Text>
              <Text style={styles.groupCaption}>{g.caption}</Text>
            </View>
            <View style={styles.grid}>
              {g.items.map((recipe) => {
                const product = findProduct(recipe.id);
                const swatch = product.swatch;
                const accent = product.accent;
                return (
                  <Pressable
                    key={recipe.id}
                    onPress={() =>
                      router.push({
                        pathname: '/preferences',
                        params: { id: recipe.id },
                      })
                    }
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  >
                    <View style={[styles.swatch, { backgroundColor: swatch }]}>
                      <View style={styles.iconLayer}>
                        <Image
                          source={recipeIcon(recipe.id, recipe.categoryKey)}
                          testID="pc-recipe-icon"
                          style={styles.cardIcon}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={[styles.savingsPill, { borderColor: accent }]}>
                        <Text style={[styles.savingsText, { color: accent }]}>
                          Save{' '}
                          {formatMoney(recipeSavingsUsd(recipe), { currency })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {recipe.title}
                      </Text>
                      <View style={styles.cardMetaRow}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={Colors.light.textMuted}
                        />
                        <Text style={styles.cardMeta}>{recipe.time}</Text>
                        <View style={styles.dot} />
                        <Text style={styles.cardMeta}>
                          {recipe.safeForKids ? 'Family-safe' : recipe.difficulty}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter recipes</Text>
            {countActive(sheetDraft) > 0 ? (
              <Pressable
                onPress={() => setSheetDraft(EMPTY_FILTERS)}
                hitSlop={8}
              >
                <Text style={styles.sheetClear}>Clear all</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.sheetSection}>Time</Text>
          <View style={styles.sheetRow}>
            {TIME_OPTIONS.map((opt) => {
              const active = sheetDraft.time === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() =>
                    setSheetDraft((s) => ({
                      ...s,
                      time: active ? null : opt.key,
                    }))
                  }
                  style={({ pressed }) => [
                    styles.sheetChip,
                    active && styles.sheetChipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[styles.sheetChipText, active && styles.sheetChipTextActive]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sheetSection}>Safety</Text>
          <View style={styles.sheetRow}>
            <Pressable
              onPress={() =>
                setSheetDraft((s) => ({ ...s, familySafe: !s.familySafe }))
              }
              style={({ pressed }) => [
                styles.sheetChip,
                sheetDraft.familySafe && styles.sheetChipActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[
                  styles.sheetChipText,
                  sheetDraft.familySafe && styles.sheetChipTextActive,
                ]}
              >
                Family-safe only
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sheetSection}>Type</Text>
          <View style={styles.sheetRow}>
            {TYPE_OPTIONS.map((opt) => {
              const active = sheetDraft.type === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() =>
                    setSheetDraft((s) => ({
                      ...s,
                      type: active ? null : opt.key,
                    }))
                  }
                  style={({ pressed }) => [
                    styles.sheetChip,
                    active && styles.sheetChipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[styles.sheetChipText, active && styles.sheetChipTextActive]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sheetActions}>
            <Pressable
              onPress={() => setSheetOpen(false)}
              style={({ pressed }) => [
                styles.sheetCancel,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setSheetApplied(sheetDraft);
                setSheetOpen(false);
              }}
              style={({ pressed }) => [
                styles.sheetApply,
                pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
              ]}
            >
              <Text style={styles.sheetApplyText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: Colors.light.sageDeep,
    borderWidth: 2,
    borderColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hero: {
    height: 240,
    marginHorizontal: -Spacing.xl,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  heroImage: { width: '100%', height: '100%' },
  topTitle: { ...Type.bodyStrong, color: Colors.light.text },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  sub: { ...Type.caption, color: Colors.light.textMuted, marginBottom: 10 },
  activePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    marginBottom: Spacing.md,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.sageDeep,
    letterSpacing: 0.4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    height: 50,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: { flex: 1, ...Type.body, color: Colors.light.text, paddingVertical: 0 },
  filterRow: { gap: Spacing.sm, paddingVertical: Spacing.lg, paddingRight: Spacing.lg },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: { backgroundColor: Colors.light.sageDeep, borderColor: Colors.light.sageDeep },
  filterText: { ...Type.caption, color: Colors.light.text },
  filterTextActive: { color: '#FFFFFF' },
  groupBlock: { marginTop: Spacing.lg },
  groupHeader: { marginBottom: Spacing.lg },
  groupLabel: { ...Type.sectionTitle, color: Colors.light.text },
  groupCaption: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  card: {
    width: '48%',
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  swatch: {
    height: 130,
    padding: Spacing.md,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  cardEmoji: { fontSize: 36 },
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
    width: '78%',
    height: '78%',
  },
  savingsPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    backgroundColor: '#FFFFFFCC',
  },
  savingsText: { ...Type.caption },
  cardBody: { padding: Spacing.md, gap: 4 },
  cardTitle: { ...Type.bodyStrong, color: Colors.light.text },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMeta: { ...Type.caption, color: Colors.light.textMuted },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.light.textSubtle },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyTitle: { ...Type.sectionTitle, color: Colors.light.text },
  emptyCaption: { ...Type.body, color: Colors.light.textMuted, marginTop: Spacing.sm },
  emptyClear: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
  },
  emptyClearText: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    fontWeight: '600',
  },

  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 36, 33, 0.32)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
    marginBottom: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sheetTitle: { ...Type.sectionTitle, color: Colors.light.text },
  sheetClear: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    fontWeight: '600',
  },
  sheetSection: {
    ...Type.caption,
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sheetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  sheetChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sheetChipActive: {
    backgroundColor: Colors.light.sageSoft,
    borderColor: Colors.light.sageDeep,
  },
  sheetChipText: { ...Type.caption, color: Colors.light.text },
  sheetChipTextActive: { color: Colors.light.sageDeep, fontWeight: '700' },
  sheetActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  sheetCancel: {
    flex: 1,
    height: 50,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: { ...Type.bodyStrong, color: Colors.light.text },
  sheetApply: {
    flex: 1.4,
    height: 50,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetApplyText: { ...Type.bodyStrong, color: '#FFFFFF' },
});

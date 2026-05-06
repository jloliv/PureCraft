// Full Search Results screen — reached from HomeSearch via "See all results"
// or the Enter key. Lives at /search?q=<query>.
//
// This screen mirrors the recipe-card grid in app/categories.tsx so results
// feel like a familiar surface — same swatch / icon / savings pill layout,
// same press target (/preferences?id=…), same empty-state pattern.
//
// The top-right circle in the toolbar is a Filter / Refine button — opens
// a modal with Problem (Grease/Odor/Stains/Mold/Dust) and Category chips.
// Doubly-useful: it lets users narrow heavy result sets AND it's the
// recovery path when a free-text query returns zero hits ("blood" → empty
// state nudges the user toward the filter sheet).

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMoney, useCurrency } from '@/constants/currency';
import { findProduct } from '@/constants/products';
import {
  RECIPE_CATEGORIES,
  type RecipeCategoryKey,
} from '@/constants/recipe-categories';
import {
  PROBLEMS,
  type ProblemId,
  recipeMatchesProblem,
} from '@/constants/recipe-problems';
import { recipeSavingsUsd, searchRecipes } from '@/constants/recipes';
import { useAllRecipes } from '@/constants/recipes-remote';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';
import { recipeIcon } from '@/lib/recipe-icons';

const SUGGESTIONS = ['Grease', 'Odor', 'Stains', 'Bathroom', 'Laundry', 'Kitchen'];
const DEBOUNCE_MS = 300;

export default function SearchResults() {
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = typeof params.q === 'string' ? params.q : '';
  const { currency } = useCurrency();
  const allRecipes = useAllRecipes();

  // The screen owns its own input so users can refine the query without
  // bouncing back to home. Initialize from the route param (?q=…).
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const inputRef = useRef<TextInput | null>(null);

  // Filter state. Two single-select dimensions for v1 — Problem and
  // Category. `applied` is what's actually filtering the visible
  // results; `draft` is the modal-local state so the user can fiddle
  // and Cancel without committing. Mirrors the same pattern as
  // app/categories.tsx so the two filter sheets feel identical.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [appliedProblem, setAppliedProblem] = useState<ProblemId | null>(null);
  const [appliedCategory, setAppliedCategory] = useState<
    RecipeCategoryKey | null
  >(null);
  const [draftProblem, setDraftProblem] = useState<ProblemId | null>(null);
  const [draftCategory, setDraftCategory] = useState<RecipeCategoryKey | null>(
    null,
  );
  const activeFilterCount =
    (appliedProblem ? 1 : 0) + (appliedCategory ? 1 : 0);

  // Debounce the input the same way HomeSearch does. 300ms is comfortable
  // for fast typers without making the catalog feel laggy.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  // Keep state in sync if the user navigates back into /search with a
  // different ?q= param (e.g. tapping a suggestion chip on Home).
  useEffect(() => {
    setQuery(initialQuery);
    setDebounced(initialQuery);
  }, [initialQuery]);

  const trimmed = debounced.trim();
  // The visible set = text-search results filtered by any active
  // filters. When the user has filters applied but no query, we show
  // every recipe that matches the filters (so the filter sheet alone
  // is a valid recovery path when free-text search returns nothing).
  const matches = useMemo(() => {
    const base = trimmed ? searchRecipes(trimmed, allRecipes) : allRecipes;
    let out = base;
    if (appliedProblem) {
      out = out.filter((r) => recipeMatchesProblem(r, appliedProblem));
    }
    if (appliedCategory) {
      out = out.filter((r) => r.categoryKey === appliedCategory);
    }
    // Don't surface "all recipes" when there's no query AND no
    // filters — that's the empty/initial state, not a result set.
    if (!trimmed && !appliedProblem && !appliedCategory) return [];
    return out;
  }, [trimmed, allRecipes, appliedProblem, appliedCategory]);

  const handleSubmit = () => {
    Keyboard.dismiss();
    setDebounced(query); // flush debounce on Enter
  };

  const handleSuggestion = (label: string) => {
    setQuery(label);
    setDebounced(label);
    inputRef.current?.focus();
  };

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
        <Text style={styles.topTitle} numberOfLines={1}>
          Search
        </Text>
        {/* Filter / Refine — opens a sheet to narrow results by
            Problem and Category. Doubles as the recovery path when
            free-text search returns zero results (e.g. "blood" →
            empty state nudges the user here). */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            activeFilterCount > 0
              ? `Filter results, ${activeFilterCount} active`
              : 'Filter results'
          }
          onPress={() => {
            setDraftProblem(appliedProblem);
            setDraftCategory(appliedCategory);
            setFilterSheetOpen(true);
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="options-outline" size={18} color={Colors.light.text} />
          {activeFilterCount > 0 ? (
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.light.textMuted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            placeholder="Find a solution…"
            placeholderTextColor={Colors.light.textSubtle}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            // Auto-focus only when entering with no existing query so the
            // keyboard doesn't pop up over results the user already wants
            // to read.
            autoFocus={!initialQuery}
          />
          {query ? (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setQuery('');
                setDebounced('');
                inputRef.current?.focus();
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {trimmed ? (
          <Text style={styles.resultMeta}>
            {matches.length} {matches.length === 1 ? 'result' : 'results'} for{' '}
            <Text style={styles.resultMetaQuery}>“{trimmed}”</Text>
            {activeFilterCount > 0 ? (
              <Text style={styles.resultMetaQuery}>
                {' '}
                · {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'}
              </Text>
            ) : null}
          </Text>
        ) : activeFilterCount > 0 ? (
          <Text style={styles.resultMeta}>
            {matches.length} {matches.length === 1 ? 'result' : 'results'} ·{' '}
            <Text style={styles.resultMetaQuery}>
              {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'}
            </Text>
          </Text>
        ) : (
          <Text style={styles.resultMeta}>Type to search by problem, ingredient, or product.</Text>
        )}

        {!trimmed && activeFilterCount === 0 ? (
          <View style={styles.suggestBlock}>
            <Text style={styles.suggestLabel}>Try one of these</Text>
            <View style={styles.chipRow}>
              {SUGGESTIONS.map((label) => (
                <Pressable
                  key={label}
                  onPress={() => handleSuggestion(label)}
                  style={({ pressed }) => [
                    styles.chip,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Search for ${label}`}
                >
                  <Text style={styles.chipText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyCaption}>
              {activeFilterCount > 0
                ? 'Your filters are narrow — try removing one, or open the Stain Guide.'
                : 'Search struggles with stain names like "blood" or "wine" — the Stain Guide handles those directly.'}
            </Text>
            {/* Open Stain Guide — replaces the old "Try one of these"
                chips. Spec is explicit: "Search failed, let me help
                you" instead of "Search failed, try again." A single
                strong CTA outperforms a row of generic suggestions
                here because it commits to a path the user can follow
                rather than asking them to guess again. */}
            <Pressable
              onPress={() => {
                tapLight();
                router.push('/stain-guide');
              }}
              style={({ pressed }) => [
                styles.stainGuideCta,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open Stain Guide"
            >
              <View style={styles.stainGuideIconWrap}>
                <Ionicons name="water" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stainGuideTitle}>Open Stain Guide</Text>
                <Text style={styles.stainGuideSub}>
                  Find the right solution for any stain
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.grid}>
            {matches.map((recipe) => {
              const product = findProduct(recipe.id);
              const swatch = product.swatch;
              const accent = product.accent;
              return (
                <Pressable
                  key={recipe.id}
                  onPress={() =>
                    router.push({ pathname: '/preferences', params: { id: recipe.id } })
                  }
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${recipe.title}`}
                >
                  <View style={[styles.swatch, { backgroundColor: swatch }]}>
                    <Image
                      source={recipeIcon(recipe.id, recipe.categoryKey)}
                      testID="pc-recipe-icon"
                      style={styles.cardIcon}
                      resizeMode="cover"
                    />
                    <View style={[styles.savingsPill, { borderColor: accent }]}>
                      <Text style={[styles.savingsText, { color: accent }]}>
                        Save {formatMoney(recipeSavingsUsd(recipe), { currency })}
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
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {recipe.safeForKids ? 'Family-safe' : recipe.categoryLabel}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* ============================ Filter sheet =========================== */}
      <Modal
        visible={filterSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterSheetOpen(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setFilterSheetOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close filters"
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Filter results</Text>
            {(draftProblem || draftCategory) ? (
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setDraftProblem(null);
                  setDraftCategory(null);
                }}
              >
                <Text style={styles.sheetClear}>Clear all</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.sheetSection}>Problem</Text>
          <View style={styles.sheetChipRow}>
            {PROBLEMS.map((p) => {
              const active = draftProblem === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setDraftProblem(active ? null : p.id)}
                  style={({ pressed }) => [
                    styles.sheetChip,
                    active && styles.sheetChipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <Ionicons
                    name={p.icon}
                    size={14}
                    color={active ? Colors.light.sageDeep : Colors.light.textMuted}
                  />
                  <Text
                    style={[
                      styles.sheetChipText,
                      active && styles.sheetChipTextActive,
                    ]}
                  >
                    {p.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sheetSection}>Category</Text>
          <View style={styles.sheetChipRow}>
            {RECIPE_CATEGORIES.map((c) => {
              const active = draftCategory === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() =>
                    setDraftCategory(active ? null : c.key)
                  }
                  style={({ pressed }) => [
                    styles.sheetChip,
                    active && styles.sheetChipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <Text
                    style={[
                      styles.sheetChipText,
                      active && styles.sheetChipTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sheetActions}>
            <Pressable
              onPress={() => setFilterSheetOpen(false)}
              style={({ pressed }) => [
                styles.sheetCancel,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setAppliedProblem(draftProblem);
                setAppliedCategory(draftCategory);
                setFilterSheetOpen(false);
              }}
              style={({ pressed }) => [
                styles.sheetApply,
                pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
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
  topTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: Colors.light.text,
    flexShrink: 1,
    paddingHorizontal: Spacing.sm,
  },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },

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

  resultMeta: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  resultMetaQuery: {
    color: Colors.light.text,
    fontWeight: '700',
  },

  suggestBlock: {
    marginTop: Spacing.lg,
  },
  suggestLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.light.textMuted,
    marginBottom: Spacing.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    borderWidth: 1,
    borderColor: 'rgba(126,143,117,0.18)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.sageDeep,
    letterSpacing: -0.1,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
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
  swatch: { height: 130, position: 'relative', overflow: 'hidden' },
  cardIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  savingsPill: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
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
  cardMeta: { ...Type.caption, color: Colors.light.textMuted, flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.light.textSubtle },

  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: { ...Type.sectionTitle, color: Colors.light.text },
  emptyCaption: {
    ...Type.body,
    color: Colors.light.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  // Filter button badge — small sage pill in the top-right of the
  // toolbar's filter button when any filter is active.
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

  // Inline "Filter results" recover CTA in the no-results empty state.
  // Sage pill so it reads as a positive action, not an error.
  recoverCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
  },
  recoverCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ============================ Filter sheet =============================
  // Mirrors the visual language of app/categories.tsx so the two filter
  // sheets feel like the same component. Backdrop tap dismisses; sheet
  // slides up from the bottom; rounded top + handle.
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
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sheetTitle: { ...Type.sectionTitle, color: Colors.light.text },
  sheetClear: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    fontWeight: '700',
  },
  sheetSection: {
    ...Type.caption,
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sheetChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  sheetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

  // ============================ Stain Guide CTA ==========================
  // Full-width card replacing the suggestion chips in the no-results
  // empty state. Reads as a primary action, not a fallback — that's
  // the entire point of the spec change.
  stainGuideCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    marginTop: Spacing.xl,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.sageDeep,
    shadowColor: Colors.light.sageDeep,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  stainGuideIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stainGuideTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stainGuideSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    marginTop: 2,
  },
});

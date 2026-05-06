// Smart Search bar that lives between Hero and "What You Can Make Right Now"
// on the Home screen. This is a navigation surface, not just a text input —
// it lets users find recipes by problem ("grease", "odor"), ingredient
// ("vinegar", "lemon"), or product type ("glass cleaner", "laundry").
//
// Behavior overview:
//  - 300ms debounce on input so big catalogs don't re-filter on every keystroke.
//  - When focused: a panel expands below the input. Empty query → suggestion
//    chips ("Grease", "Odor", "Stains", "Bathroom", "Laundry", "Kitchen") that
//    auto-fill the input. Non-empty query → top 5 matching recipes with
//    thumbnail / title / time, plus a "See all results" footer that navigates
//    to /search?q=<query>.
//  - Pressing Enter or "See all results" routes to the full Search Results
//    screen at app/search.tsx.
//
// Implementation notes:
//  - Uses `searchRecipes` from constants/recipes (extended to query tags +
//    categoryKey so chips like "Bathroom" / "Kitchen" resolve correctly).
//  - Renders the dropdown in-flow (not absolutely positioned) so it pushes
//    the rest of Home down. This avoids ScrollView overflow-clipping issues
//    on iOS / web and keeps the interaction feeling native: the user is in
//    "search mode" until they dismiss.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { searchRecipes, type Recipe } from '@/constants/recipes';
import { useAllRecipes } from '@/constants/recipes-remote';
import { tapLight } from '@/lib/haptics';
import { recipeIcon } from '@/lib/recipe-icons';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#1F1F1F',
  textMuted: '#6F6A60',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  surfaceWarm: '#F1ECE0',
  surfaceSoft: '#FAF6EC',
  border: '#E8E2D2',
  borderSoft: '#EFE9DA',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
};

// Suggestion chips shown when the search is focused and empty. These map
// to natural-language problem / room queries — the search engine handles
// matching them against title / tags / ingredients / categoryKey.
const SUGGESTIONS = ['Grease', 'Odor', 'Stains', 'Bathroom', 'Laundry', 'Kitchen'];

// Top-of-dropdown cap. Spec says "Top 5 matching recipes".
const LIVE_RESULTS_LIMIT = 5;

// Debounce delay for live filtering. Spec calls for 300ms.
const DEBOUNCE_MS = 300;

export function HomeSearch() {
  const allRecipes = useAllRecipes();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput | null>(null);

  // Debounce the query so we don't refilter the catalog on every keystroke.
  // useEffect's cleanup clears the timer when a new keystroke arrives before
  // the previous one fires — classic debounce.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const trimmed = debounced.trim();
  const hasQuery = trimmed.length > 0;
  // Panel opens any time the input is focused OR has content. Showing while
  // focused-but-empty surfaces the suggestion chips; showing while not
  // focused but with content lets the user tap a result without hiding it.
  const panelOpen = focused || hasQuery;

  const matches = useMemo<Recipe[]>(() => {
    if (!hasQuery) return [];
    return searchRecipes(trimmed, allRecipes);
  }, [trimmed, hasQuery, allRecipes]);

  const top = matches.slice(0, LIVE_RESULTS_LIMIT);
  const remaining = Math.max(0, matches.length - top.length);

  const goToFullResults = (q: string) => {
    const final = q.trim();
    if (!final) return;
    tapLight();
    Keyboard.dismiss();
    inputRef.current?.blur();
    router.push({ pathname: '/search', params: { q: final } });
  };

  const handleSuggestionTap = (label: string) => {
    tapLight();
    setQuery(label);
    // Keep focus so the live dropdown stays open showing the results.
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.bar, focused && styles.barFocused]}>
        {/* Sage-tinted search "badge" reads as an icon button instead of a
            passive glyph — gives the bar a clear visual anchor and makes
            the whole pill feel like a tappable nav surface, not an input. */}
        <View style={styles.searchBadge}>
          <Ionicons name="search" size={16} color="#FFFFFF" />
        </View>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => goToFullResults(query)}
          placeholder="Find a solution…"
          placeholderTextColor={PALETTE.textMuted}
          returnKeyType="search"
          accessibilityLabel="Search recipes"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
        />
        {query.length > 0 ? (
          <Pressable
            onPress={handleClear}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={PALETTE.textMuted} />
          </Pressable>
        ) : (
          <View style={styles.kbdHint}>
            <Text style={styles.kbdHintText}>Search</Text>
          </View>
        )}
      </View>

      {panelOpen ? (
        <View style={styles.panel}>
          {!hasQuery ? (
            <SuggestionChips onSelect={handleSuggestionTap} />
          ) : top.length > 0 ? (
            <>
              {top.map((r) => (
                <ResultRow key={r.id} recipe={r} />
              ))}
              {remaining > 0 ? (
                <Pressable
                  onPress={() => goToFullResults(query)}
                  style={({ pressed }) => [
                    styles.seeAll,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="See all matching recipes"
                >
                  <Text style={styles.seeAllText}>
                    See all results
                    {matches.length > 0 ? ` (${matches.length})` : ''}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={PALETTE.sageDeep} />
                </Pressable>
              ) : null}
            </>
          ) : (
            <EmptyState />
          )}
        </View>
      ) : null}
    </View>
  );
}

function ResultRow({ recipe }: { recipe: Recipe }) {
  return (
    <Pressable
      onPress={() => {
        tapLight();
        Keyboard.dismiss();
        router.push({ pathname: '/preferences', params: { id: recipe.id } });
      }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${recipe.title}`}
    >
      <View style={styles.rowThumb}>
        <Image
          source={recipeIcon(recipe.id, recipe.categoryKey)}
          testID="pc-recipe-icon"
          style={styles.rowThumbImg}
          resizeMode="cover"
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
        <View style={styles.rowMetaWrap}>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {recipe.time} · {recipe.categoryLabel}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={PALETTE.textSubtle} />
    </Pressable>
  );
}

function SuggestionChips({ onSelect }: { onSelect: (label: string) => void }) {
  return (
    <View>
      <Text style={styles.suggestionLabel}>Try one of these</Text>
      <View style={styles.chipRow}>
        {SUGGESTIONS.map((label) => (
          <Pressable
            key={label}
            onPress={() => onSelect(label)}
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
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptyCaption}>
        Try searching “grease”, “vinegar”, or “bathroom”.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // 16px below hero, 16px above next section — within the 16-20 / 12-16
  // bands the spec lays out, and matches the 32px sectionHeader margin
  // already used in home.tsx so the rhythm doesn't break.
  wrapper: {
    marginTop: 16,
    marginBottom: 16,
  },
  // Pill bar styled to *stand out* against the warm beige Home background:
  //   - Bright white surface so it pops off the cream page color.
  //   - Soft drop shadow so the bar reads as a floating CTA, matching the
  //     same elevation language used by recipe cards elsewhere in the app.
  //   - Slightly taller (56px) so it feels substantial alongside the hero.
  //   - Sage-tinted search badge on the left + "Search" label on the right
  //     anchor the bar visually and make it scannable in 1/4 second.
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 8,
    paddingRight: 14,
    height: 56,
    borderRadius: 28,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  barFocused: {
    borderColor: PALETTE.sageDeep,
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  // Sage circle holding the search icon. Sized to inset cleanly within the
  // 56px pill (40px badge + 8px paddingLeft = visually centered).
  searchBadge: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '500',
    color: PALETTE.text,
    paddingVertical: 0,
    // Some Android builds add a default underline; this keeps the pill clean.
    // No-op on iOS/web.
    includeFontPadding: false,
  },
  // Subtle right-side affordance — reads as "this is a search surface" the
  // moment the bar enters view. Disappears as soon as the user starts
  // typing (replaced by the close-icon clear button).
  kbdHint: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: PALETTE.surfaceWarm,
  },
  kbdHintText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: PALETTE.textMuted,
    textTransform: 'uppercase',
  },

  panel: {
    marginTop: 10,
    backgroundColor: PALETTE.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    paddingVertical: 6,
    paddingHorizontal: 6,
    // Soft elevation so the panel feels detached from the input.
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: PALETTE.surfaceWarm,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  rowThumbImg: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text,
    letterSpacing: -0.1,
  },
  rowMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMeta: {
    fontSize: 12,
    color: PALETTE.textMuted,
  },

  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderSoft,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    letterSpacing: 0.2,
  },

  suggestionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: PALETTE.textMuted,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    borderWidth: 1,
    borderColor: 'rgba(126,143,117,0.18)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.sageDeep,
    letterSpacing: -0.1,
  },

  empty: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.text,
  },
  emptyCaption: {
    fontSize: 12.5,
    color: PALETTE.textMuted,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
});

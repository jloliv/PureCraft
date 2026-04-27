import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMoney, useCurrency } from '@/constants/currency';
import { findProduct } from '@/constants/products';

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

type Ingredient = {
  key: string;
  name: string;
  emoji: string;
  group: 'pantry' | 'oils' | 'tools';
  defaultIn?: boolean;
};

const INGREDIENTS: Ingredient[] = [
  { key: 'baking-soda', name: 'Baking Soda', emoji: '🧂', group: 'pantry', defaultIn: true },
  { key: 'white-vinegar', name: 'White Vinegar', emoji: '🍶', group: 'pantry', defaultIn: true },
  { key: 'lemon', name: 'Lemon', emoji: '🍋', group: 'pantry', defaultIn: true },
  { key: 'coconut-oil', name: 'Coconut Oil', emoji: '🥥', group: 'pantry', defaultIn: true },
  { key: 'olive-oil', name: 'Olive Oil', emoji: '🫒', group: 'pantry', defaultIn: true },
  { key: 'sugar', name: 'Sugar', emoji: '🍚', group: 'pantry', defaultIn: true },
  { key: 'castile-soap', name: 'Castile Soap', emoji: '🫧', group: 'pantry' },
  { key: 'witch-hazel', name: 'Witch Hazel', emoji: '🌿', group: 'pantry' },
  { key: 'distilled-water', name: 'Distilled Water', emoji: '💧', group: 'pantry' },
  { key: 'sea-salt', name: 'Sea Salt', emoji: '🧂', group: 'pantry' },
  { key: 'cornstarch', name: 'Cornstarch', emoji: '🌽', group: 'pantry' },
  { key: 'honey', name: 'Honey', emoji: '🍯', group: 'pantry' },
  { key: 'lavender-oil', name: 'Lavender Oil', emoji: '🪻', group: 'oils' },
  { key: 'tea-tree-oil', name: 'Tea Tree Oil', emoji: '🌱', group: 'oils' },
  { key: 'eucalyptus-oil', name: 'Eucalyptus Oil', emoji: '🌿', group: 'oils' },
  { key: 'rosemary-oil', name: 'Rosemary Oil', emoji: '🌾', group: 'oils' },
  { key: 'spray-bottles', name: 'Spray Bottles', emoji: '🧴', group: 'tools', defaultIn: true },
  { key: 'glass-jars', name: 'Glass Jars', emoji: '🫙', group: 'tools' },
  { key: 'funnel', name: 'Funnel', emoji: '🥽', group: 'tools' },
];

const GROUP_LABELS: Record<Ingredient['group'], { label: string; caption: string }> = {
  pantry: { label: 'Pantry', caption: 'Cooking + cleaning staples' },
  oils: { label: 'Essential Oils', caption: 'Beauty + scent ingredients' },
  tools: { label: 'Tools', caption: 'For making + storing' },
};

const SUGGESTED_RECIPES = [
  { id: 'citrus-countertop-cleaner' },
  { id: 'vanilla-sugar-scrub' },
  { id: 'glass-cleaner' },
  { id: 'kitchen-spray' },
];

export default function Pantry() {
  const { currency } = useCurrency();
  const [pantry, setPantry] = useState<Set<string>>(
    () => new Set(INGREDIENTS.filter((i) => i.defaultIn).map((i) => i.key)),
  );
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);

  const toggle = (key: string) => {
    setPantry((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const remove = (key: string) => {
    setPantry((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INGREDIENTS;
    return INGREDIENTS.filter((i) => i.name.toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<Ingredient['group'], Ingredient[]> = {
      pantry: [],
      oils: [],
      tools: [],
    };
    for (const i of filtered) groups[i.group].push(i);
    return groups;
  }, [filtered]);

  const inPantryCount = pantry.size;
  const recipesReady = SUGGESTED_RECIPES.filter((r) => {
    return inPantryCount >= 4;
  }).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={20} color={PALETTE.text} />
        </Pressable>
        <Text style={styles.topTitle}>Pantry</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Done editing' : 'Edit pantry'}
          onPress={() => setEditing((e) => !e)}
          hitSlop={8}
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.editBtnText}>{editing ? 'Done' : 'Edit'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heroEyebrow}>Your pantry</Text>
        <Text style={styles.heroSub}>What you already have at home</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={PALETTE.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search pantry ingredients"
            placeholderTextColor={PALETTE.textSubtle}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query ? (
            <Pressable hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={PALETTE.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => router.push('/discover')}
          style={({ pressed }) => [styles.statsCard, pressed && { opacity: 0.95 }]}
        >
          <LinearGradient
            colors={['#EFE7D2', '#F7F2E7', '#E4EDE5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsGradient}
          >
            <View style={styles.statsRow}>
              <View style={styles.statsBlock}>
                <Text style={styles.statsValue}>{inPantryCount}</Text>
                <Text style={styles.statsLabel}>ingredients</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsBlock}>
                <Text style={styles.statsValue}>{recipesReady > 0 ? recipesReady : 0}</Text>
                <Text style={styles.statsLabel}>recipes ready</Text>
              </View>
            </View>
            <Text style={styles.statsCta}>See what you can make now →</Text>
          </LinearGradient>
        </Pressable>

        {(['pantry', 'oils', 'tools'] as const).map((g) => {
          const items = grouped[g];
          if (items.length === 0) return null;
          const inCount = items.filter((i) => pantry.has(i.key)).length;
          return (
            <View key={g} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>{GROUP_LABELS[g].label}</Text>
                  <Text style={styles.sectionCaption}>{GROUP_LABELS[g].caption}</Text>
                </View>
                <Text style={styles.sectionMeta}>
                  {inCount} / {items.length}
                </Text>
              </View>
              <View style={styles.list}>
                {items.map((it, i) => {
                  const isIn = pantry.has(it.key);
                  return (
                    <Pressable
                      key={it.key}
                      onPress={() => (editing ? remove(it.key) : toggle(it.key))}
                      style={({ pressed }) => [
                        styles.row,
                        i === 0 && { borderTopWidth: 0 },
                        isIn && styles.rowIn,
                        pressed && { transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      <View style={[styles.rowEmojiWrap, isIn && styles.rowEmojiWrapIn]}>
                        <Text style={styles.rowEmoji}>{it.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowName}>{it.name}</Text>
                        <Text style={styles.rowStatus}>
                          {isIn ? 'In your pantry' : 'Tap to add'}
                        </Text>
                      </View>
                      {editing && isIn ? (
                        <View style={styles.removeBtn}>
                          <Ionicons name="remove" size={14} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={[styles.check, isIn && styles.checkIn]}>
                          {isIn ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.92 }]}
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={18} color={PALETTE.sageDeep} />
          </View>
          <Text style={styles.addText}>Add custom ingredient</Text>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Recipes you can make now</Text>
              <Text style={styles.sectionCaption}>Built from what you already have</Text>
            </View>
            <Pressable hitSlop={8} onPress={() => router.push('/discover')}>
              <Text style={styles.sectionAction}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipeRow}
          >
            {SUGGESTED_RECIPES.map((s) => {
              const p = findProduct(s.id);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => router.push({ pathname: '/preferences', params: { id: s.id } })}
                  style={({ pressed }) => [styles.recipeCard, pressed && { transform: [{ scale: 0.98 }] }]}
                >
                  <View style={[styles.recipeSwatch, { backgroundColor: p.swatch }]}>
                    <Text style={styles.recipeEmoji}>{p.emoji}</Text>
                    <View style={styles.readyBadge}>
                      <View style={styles.readyDot} />
                      <Text style={styles.readyText}>Ready</Text>
                    </View>
                  </View>
                  <Text style={styles.recipeTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.recipeMeta}>
                    {p.time} · save {formatMoney(p.savingsUsd, { currency })}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.text, letterSpacing: -0.2 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: PALETTE.sageDeep },

  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  heroEyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '600',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  heroSub: {
    fontSize: 16,
    color: PALETTE.text,
    marginTop: 4,
    marginBottom: 18,
    fontWeight: '500',
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

  statsCard: {
    marginTop: 18,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  statsGradient: {
    padding: 18,
    gap: 12,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statsBlock: { flex: 1, alignItems: 'center' },
  statsValue: { fontSize: 28, fontWeight: '700', color: PALETTE.text, letterSpacing: -0.6 },
  statsLabel: { fontSize: 12, color: PALETTE.textMuted, marginTop: 2 },
  statsDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#FFFFFFCC' },
  statsCta: { fontSize: 12.5, fontWeight: '600', color: PALETTE.sageDeep, textAlign: 'center' },

  section: { marginTop: 26 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: PALETTE.text, letterSpacing: -0.3 },
  sectionCaption: { fontSize: 12, color: PALETTE.textMuted, marginTop: 2 },
  sectionMeta: { fontSize: 12, fontWeight: '600', color: PALETTE.sageDeep },
  sectionAction: { fontSize: 12.5, fontWeight: '600', color: PALETTE.goldDeep },

  list: {
    backgroundColor: PALETTE.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  rowIn: { backgroundColor: '#FBFAF6' },
  rowEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PALETTE.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmojiWrapIn: { backgroundColor: PALETTE.sageSoft },
  rowEmoji: { fontSize: 22 },
  rowName: { fontSize: 14, fontWeight: '600', color: PALETTE.text },
  rowStatus: { fontSize: 11.5, color: PALETTE.textMuted, marginTop: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIn: { backgroundColor: PALETTE.sageDeep, borderColor: PALETTE.sageDeep },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: PALETTE.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderStyle: 'dashed',
  },
  addIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontSize: 13.5, fontWeight: '600', color: PALETTE.text },

  recipeRow: { gap: 12, paddingRight: 12 },
  recipeCard: { width: 160, gap: 8 },
  recipeSwatch: {
    height: 130,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  recipeEmoji: { fontSize: 32 },
  readyBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFFE6',
  },
  readyDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: PALETTE.sageDeep },
  readyText: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  recipeTitle: { fontSize: 13.5, fontWeight: '700', color: PALETTE.text },
  recipeMeta: { fontSize: 11.5, color: PALETTE.textMuted, marginTop: -2 },
});

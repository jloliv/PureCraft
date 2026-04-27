import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMoney, useCurrency } from '@/constants/currency';
import { PRODUCT_GROUPS, PRODUCTS, type Product, type ProductGroup } from '@/constants/products';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

export default function Categories() {
  const { currency } = useCurrency();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | ProductGroup>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      const matchesGroup = filter === 'all' || p.group === filter;
      const matchesQuery = !q || p.title.toLowerCase().includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [query, filter]);

  const grouped = useMemo(() => {
    return PRODUCT_GROUPS.map((g) => ({
      ...g,
      items: filtered.filter((p: Product) => p.group === g.key),
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

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
        <Text style={styles.topTitle}>Make something</Text>
        <View style={styles.iconBtn}>
          <Ionicons name="options-outline" size={18} color={Colors.light.text} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.light.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search recipes"
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
          {(['all', 'cleaning', 'beauty', 'home'] as const).map((f) => {
            const isActive = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={({ pressed }) => [
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {grouped.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyCaption}>Try a different keyword or filter.</Text>
          </View>
        ) : null}

        {grouped.map((g) => (
          <View key={g.key} style={styles.groupBlock}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupLabel}>{g.label}</Text>
              <Text style={styles.groupCaption}>{g.caption}</Text>
            </View>
            <View style={styles.grid}>
              {g.items.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push({ pathname: '/preferences', params: { id: p.id } })}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  <View style={[styles.swatch, { backgroundColor: p.swatch }]}>
                    <Text style={styles.cardEmoji}>{p.emoji}</Text>
                    <View style={[styles.savingsPill, { borderColor: p.accent }]}>
                      <Text style={[styles.savingsText, { color: p.accent }]}>Save {formatMoney(p.savingsUsd, { currency })}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{p.title}</Text>
                    <View style={styles.cardMetaRow}>
                      <Ionicons name="time-outline" size={12} color={Colors.light.textMuted} />
                      <Text style={styles.cardMeta}>{p.time}</Text>
                      <View style={styles.dot} />
                      <Text style={styles.cardMeta}>{p.tags[0]}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
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
  topTitle: { ...Type.bodyStrong, color: Colors.light.text },
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
  },
  cardEmoji: { fontSize: 36 },
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
});

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CURRENCIES, formatMoney, useCurrency, type Currency } from '@/constants/currency';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

export default function CurrencyPicker() {
  const { currency, setCurrency } = useCurrency();

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
        <Text style={styles.topTitle}>Currency</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Display prices in</Text>
        <Text style={styles.headline}>Pick your currency.</Text>
        <Text style={styles.sub}>
          We&apos;ll convert all savings, ingredient prices, and shopping totals to your choice.
        </Text>

        <View style={styles.preview}>
          <View style={styles.previewIcon}>
            <Ionicons name="cash-outline" size={20} color={Colors.light.sageDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewLabel}>Sample saving on a bathroom cleaner</Text>
            <Text style={styles.previewValue}>{formatMoney(3.20, { currency })}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {CURRENCIES.map((c, i) => (
            <CurrencyRow
              key={c.code}
              currency={c}
              isSelected={c.code === currency.code}
              isLast={i === CURRENCIES.length - 1}
              onPress={() => setCurrency(c.code)}
            />
          ))}
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.light.textMuted} />
          <Text style={styles.noteText}>
            Conversion uses static rates. We&apos;ll update to live rates when you go online.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CurrencyRow({
  currency,
  isSelected,
  isLast,
  onPress,
}: {
  currency: Currency;
  isSelected: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isLast && { borderBottomWidth: 0 },
        pressed && { backgroundColor: Colors.light.surfaceAlt },
      ]}
    >
      <Text style={styles.flag}>{currency.flag}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>
          {currency.name} <Text style={styles.rowCode}>· {currency.code}</Text>
        </Text>
        <Text style={styles.rowMeta}>
          {currency.symbol} · {formatMoney(1, { currency })} per {formatMoney(1)}
        </Text>
      </View>
      <View style={[styles.radio, isSelected && styles.radioActive]}>
        {isSelected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
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
  eyebrow: { ...Type.caption, color: Colors.light.sageDeep, textTransform: 'uppercase' },
  headline: { ...Type.title, color: Colors.light.text, marginTop: Spacing.sm },
  sub: { ...Type.body, color: Colors.light.textMuted, marginTop: Spacing.sm },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.cream,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
    ...Shadow.card,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: { ...Type.caption, color: Colors.light.textMuted },
  previewValue: { ...Type.title, color: Colors.light.text, marginTop: 2 },
  list: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    marginTop: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  flag: { fontSize: 26 },
  rowTitle: { ...Type.bodyStrong, color: Colors.light.text },
  rowCode: { ...Type.caption, color: Colors.light.textMuted, fontWeight: '500' },
  rowMeta: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.light.sageDeep },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  noteText: { ...Type.caption, color: Colors.light.textMuted, flex: 1, lineHeight: 18 },
});

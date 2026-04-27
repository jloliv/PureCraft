import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { formatMoney, useCurrency } from '@/constants/currency';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { icon: 'infinite-outline', title: 'Unlimited formulas', sub: 'Generate as many recipes as you need' },
  { icon: 'people-outline', title: 'Family-safe profiles', sub: 'Save preferences for every person & pet' },
  { icon: 'cart-outline', title: 'Smart shopping planner', sub: 'Auto-batch ingredients across recipes' },
  { icon: 'lock-open-outline', title: 'Premium recipes', sub: 'Whipped butters, candles & artisan blends' },
  { icon: 'cloud-download-outline', title: 'Print & export', sub: 'Beautiful PDFs and pantry lists' },
  { icon: 'sparkles-outline', title: 'Early access', sub: 'New formulas before everyone else' },
];

const PLANS = [
  {
    id: 'monthly' as const,
    label: 'Monthly',
    priceUsd: 5.99,
    cadence: '/ mo',
    badge: undefined as string | undefined,
  },
  {
    id: 'yearly' as const,
    label: 'Yearly',
    priceUsd: 39,
    cadence: '/ yr',
    badge: 'Best value' as string | undefined,
  },
];

export default function Premium() {
  const { currency } = useCurrency();
  const [plan, setPlan] = useState<(typeof PLANS)[number]['id']>('yearly');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="close" size={20} color={Colors.light.text} />
        </Pressable>
        <Pressable hitSlop={8} onPress={() => {}}>
          <Text style={styles.restore}>Restore</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#7B9E89', '#5C7F6B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            <Text style={styles.heroBadgeText}>PureCraft+</Text>
          </View>
          <Text style={styles.heroTitle}>Protect your home,{`\n`}smarter.</Text>
          <Text style={styles.heroSub}>
            Unlock unlimited safe formulas, family profiles, and a smarter shopping planner.
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{formatMoney(420, { currency, round: true })}+</Text>
              <Text style={styles.heroStatLabel}>saved / yr avg.</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>120+</Text>
              <Text style={styles.heroStatLabel}>premium recipes</Text>
            </View>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>What you unlock</Text>
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={Colors.light.sageDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.light.sage} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Choose your PureCraft plan</Text>
        <View style={styles.plans}>
          {PLANS.map((p) => {
            const isActive = plan === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPlan(p.id)}
                style={({ pressed }) => [
                  styles.plan,
                  isActive && styles.planActive,
                  pressed && { transform: [{ scale: 0.99 }] },
                ]}
              >
                {p.badge ? (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{p.badge}</Text>
                  </View>
                ) : null}
                <View style={[styles.radio, isActive && styles.radioActive]}>
                  {isActive ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planLabel}>{p.label}</Text>
                  <Text style={styles.planSub}>
                    {p.id === 'yearly'
                      ? `Just ${formatMoney(p.priceUsd / 12, { currency })} / mo · save 46%`
                      : 'Cancel anytime'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.planPrice}>{formatMoney(p.priceUsd, { currency, decimals: p.id === 'yearly' ? 0 : 2 })}</Text>
                  <Text style={styles.planCadence}>{p.cadence}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.guarantee}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.light.textMuted} />
          <Text style={styles.guaranteeText}>
            Cancel anytime · Privacy-first · No hidden fees
          </Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Try free for 7 days"
          trailingIcon="arrow-forward"
          onPress={() => router.back()}
        />
        <Text style={styles.fineprint}>
          Then {plan === 'yearly'
            ? `${formatMoney(39, { currency, decimals: 0 })} / yr`
            : `${formatMoney(5.99, { currency })} / mo`} · cancel anytime
        </Text>
      </View>
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
  restore: { ...Type.caption, color: Colors.light.sageDeep, fontWeight: '600' },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    overflow: 'hidden',
    ...Shadow.raised,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF22',
    borderWidth: 1,
    borderColor: '#FFFFFF55',
  },
  heroBadgeText: { ...Type.micro, color: '#FFFFFF' },
  heroTitle: { ...Type.hero, color: '#FFFFFF', marginTop: Spacing.lg },
  heroSub: { ...Type.body, color: '#FFFFFFD0', marginTop: Spacing.sm },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF18',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: '#FFFFFF35',
  },
  heroStat: { flex: 1 },
  heroStatValue: { ...Type.title, color: '#FFFFFF' },
  heroStatLabel: { ...Type.caption, color: '#FFFFFFC0', marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: '#FFFFFF35', marginHorizontal: Spacing.md },
  sectionTitle: { ...Type.sectionTitle, color: Colors.light.text, marginTop: Spacing.xxl, marginBottom: Spacing.lg },
  featureList: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { ...Type.bodyStrong, color: Colors.light.text },
  featureSub: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  plans: { gap: Spacing.md },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: 'relative',
  },
  planActive: {
    backgroundColor: Colors.light.sageSoft,
    borderColor: Colors.light.sageDeep,
    ...Shadow.card,
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
  },
  planBadgeText: { ...Type.micro, color: '#FFFFFF' },
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
  planLabel: { ...Type.bodyStrong, color: Colors.light.text },
  planSub: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  planPrice: { ...Type.title, color: Colors.light.text },
  planCadence: { ...Type.caption, color: Colors.light.textMuted },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.lg,
  },
  guaranteeText: { ...Type.caption, color: Colors.light.textMuted },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: Spacing.sm,
  },
  fineprint: {
    ...Type.caption,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
});

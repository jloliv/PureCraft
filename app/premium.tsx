import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { events } from '@/lib/analytics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { formatMoney, useCurrency } from '@/constants/currency';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { icon: 'lock-open-outline', title: '120+ premium recipes', sub: 'Whipped butters, candles, scrubs & artisan blends' },
  { icon: 'leaf-outline', title: 'Seasonal recipe packs', sub: 'Spring reset, summer skin, holiday gifting' },
  { icon: 'medkit-outline', title: 'Advanced allergy filtering', sub: 'Multi-allergen profiles auto-substitute every recipe' },
  { icon: 'people-outline', title: 'Family household profiles', sub: 'Save preferences for every person & pet' },
  { icon: 'restaurant-outline', title: 'Unlimited pantry matching', sub: 'Recipes from what you already have' },
  { icon: 'cart-outline', title: 'Auto shopping lists', sub: 'Batches ingredients across selected recipes' },
  { icon: 'flower-outline', title: 'Premium beauty recipes', sub: 'Spa-grade body butters, masks & scrubs' },
  { icon: 'sparkles-outline', title: 'Deep cleaning bundles', sub: 'Bathroom, kitchen, mold rescue, pet odors' },
  { icon: 'folder-open-outline', title: 'Saved favorites folders', sub: 'Organize recipes into routines + collections' },
  { icon: 'flask-outline', title: 'AI custom recipe builder', sub: 'Generate one-of-one formulas from your prompts' },
];

// Locked premium recipes preview — visual proof of what they're unlocking.
// Render with a blur/lock overlay so users want to tap "Start Free Trial".
const LOCKED_RECIPES: { title: string; tag: string; accent: string }[] = [
  { title: 'Luxury Glass Cleaner', tag: 'Cleaning', accent: '#E4EDE5' },
  { title: 'Baby Nursery Sanitizer', tag: 'Baby-safe', accent: '#F1ECE0' },
  { title: 'Sensitive Skin Body Butter', tag: 'Beauty', accent: '#F7F2E7' },
  { title: 'Pet Couch Deodorizer', tag: 'Pet-safe', accent: '#EFE7D2' },
  { title: 'Mold Rescue Spray', tag: 'Heavy duty', accent: '#E4EDE5' },
  { title: 'Spa Linen Mist', tag: 'Bedroom', accent: '#F7F2E7' },
];

const PLANS = [
  {
    id: 'monthly' as const,
    label: 'Monthly',
    priceUsd: 4.99,
    cadence: '/ mo',
    badge: undefined as string | undefined,
  },
  {
    id: 'yearly' as const,
    label: 'Yearly',
    priceUsd: 29.99,
    cadence: '/ yr',
    badge: 'Best Value' as string | undefined,
  },
  {
    id: 'lifetime' as const,
    label: 'Lifetime',
    priceUsd: 49,
    cadence: 'once',
    badge: 'Founding Member Offer' as string | undefined,
  },
];

export default function Premium() {
  const { currency } = useCurrency();
  const [plan, setPlan] = useState<(typeof PLANS)[number]['id']>('yearly');

  // Paywall view is the most important conversion event — fire on mount.
  useEffect(() => {
    events.paywallViewed();
  }, []);

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

        <Text style={styles.sectionTitle}>Premium recipes preview</Text>
        <Text style={styles.sectionSub}>
          Tap into 120+ formulas you can&apos;t make yet. Here&apos;s a peek.
        </Text>
        <View style={styles.lockedGrid}>
          {LOCKED_RECIPES.map((r) => (
            <View key={r.title} style={[styles.lockedCard, { backgroundColor: r.accent }]}>
              <View style={styles.lockedSwatch}>
                <Ionicons name="lock-closed" size={16} color={Colors.light.sageDeep} />
              </View>
              <Text style={styles.lockedTitle} numberOfLines={2}>
                {r.title}
              </Text>
              <Text style={styles.lockedTag}>{r.tag}</Text>
            </View>
          ))}
        </View>

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
                      ? `Just ${formatMoney(p.priceUsd / 12, { currency })} / mo · save 50%`
                      : p.id === 'lifetime'
                        ? 'Pay once, keep forever'
                        : 'Cancel anytime'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.planPrice}>
                    {formatMoney(p.priceUsd, {
                      currency,
                      decimals: p.id === 'lifetime' ? 0 : 2,
                    })}
                  </Text>
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
          label={plan === 'lifetime' ? 'Become a Founding Member' : 'Start Free Trial'}
          trailingIcon="arrow-forward"
          onPress={() => {
            // TODO: hook to RevenueCat purchase flow once paywall product
            // IDs are configured. For now, capture the intent and show a
            // success affordance via the back transition.
            router.back();
          }}
        />
        <Text style={styles.fineprint}>
          {plan === 'lifetime'
            ? `${formatMoney(49, { currency, decimals: 0 })} once · no recurring billing`
            : plan === 'yearly'
              ? `7 days free · then ${formatMoney(29.99, { currency })} / yr · cancel anytime`
              : `7 days free · then ${formatMoney(4.99, { currency })} / mo · cancel anytime`}
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
  sectionTitle: { ...Type.sectionTitle, color: Colors.light.text, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  sectionSub: { ...Type.caption, color: Colors.light.textMuted, marginBottom: Spacing.lg },

  lockedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  lockedCard: {
    width: '31.5%',
    flexGrow: 1,
    minHeight: 110,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  lockedSwatch: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: { ...Type.bodyStrong, color: Colors.light.text, fontSize: 12.5, lineHeight: 16, marginTop: 6 },
  lockedTag: { ...Type.caption, color: Colors.light.textMuted, fontSize: 10.5 },
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

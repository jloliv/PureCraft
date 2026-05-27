import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { events } from '@/lib/analytics';
import { useAuth } from '@/lib/auth';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { formatMoney, useCurrency } from '@/constants/currency';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import {
  purchase,
  restorePurchases,
  usePaywall,
  type PaywallIntroPrice,
  type PaywallOffering,
} from '@/lib/paywall';

const UNLOCK_ITEMS: string[] = [
  'Unlimited recipes',
  'Personalized formulas for your home',
  'Baby & sensitive-safe filtering',
  'Pantry-based recipe suggestions',
  'Save & organize your routines',
];

const PREMIUM_PREVIEW = {
  title: 'Luxury Glass Cleaner',
  subtitle: 'Streak-free · Non-toxic · High shine',
  image: require('../assets/images/luxury-glass-cleaner.png'),
};

type Cadence = 'monthly' | 'yearly' | 'lifetime';

type DerivedPlan = {
  identifier: string;
  cadence: Cadence;
  label: string;
  badge?: string;
  priceString: string;
  cadenceSuffix: string;
  subtitle: string;
  introCopy?: string;
};

// Used when RevenueCat offerings aren't loaded yet (e.g. dev without keys).
// Lets the screen stay runnable; real prices/trials come from the store once
// `usePaywall().offerings` populates.
const FALLBACK_USD: Array<{
  cadence: Cadence;
  label: string;
  priceUsd: number;
  badge?: string;
}> = [
  { cadence: 'monthly', label: 'Monthly', priceUsd: 4.99 },
  { cadence: 'yearly', label: 'Yearly', priceUsd: 29.99, badge: 'Best Value' },
  { cadence: 'lifetime', label: 'Lifetime', priceUsd: 49, badge: 'Founding Member Offer' },
];

function badgeFor(c: Cadence): string | undefined {
  if (c === 'yearly') return 'Best Value';
  if (c === 'lifetime') return 'Founding Member Offer';
  return undefined;
}

function suffixFor(c: Cadence): string {
  if (c === 'monthly') return '/ mo';
  if (c === 'yearly') return '/ yr';
  return 'once';
}

function labelFor(c: Cadence): string {
  if (c === 'monthly') return 'Monthly';
  if (c === 'yearly') return 'Yearly';
  return 'Lifetime';
}

function formatIntroPeriod(intro: PaywallIntroPrice): string {
  const n = intro.periodNumberOfUnits;
  const unit = intro.periodUnit.toLowerCase();
  const word = n === 1 ? unit : `${unit}s`;
  const isFree = /^[^\d]*0([.,]0+)?[^\d]*$/.test(intro.priceString);
  return isFree ? `${n} ${word} free` : `${intro.priceString} for ${n} ${word}`;
}

function planFromOffering(o: PaywallOffering): DerivedPlan | null {
  if (o.cadence === 'unknown') return null;
  return {
    identifier: o.identifier,
    cadence: o.cadence,
    label: labelFor(o.cadence),
    badge: badgeFor(o.cadence),
    priceString: o.priceString,
    cadenceSuffix: suffixFor(o.cadence),
    subtitle:
      o.cadence === 'monthly'
        ? 'Cancel anytime'
        : o.cadence === 'yearly'
          ? 'Best value vs monthly'
          : 'Pay once, keep forever',
    introCopy: o.introPrice ? formatIntroPeriod(o.introPrice) : undefined,
  };
}

const CADENCE_ORDER: Cadence[] = ['monthly', 'yearly', 'lifetime'];

export default function Premium() {
  const { currency } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const { offerings, loading: paywallLoading } = usePaywall();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const plans = useMemo<DerivedPlan[]>(() => {
    const fromOfferings = offerings
      .map(planFromOffering)
      .filter((p): p is DerivedPlan => p !== null)
      .sort(
        (a, b) =>
          CADENCE_ORDER.indexOf(a.cadence) - CADENCE_ORDER.indexOf(b.cadence),
      );
    if (fromOfferings.length > 0) return fromOfferings;
    return FALLBACK_USD.map((p) => ({
      identifier: `fallback-${p.cadence}`,
      cadence: p.cadence,
      label: p.label,
      badge: p.badge,
      priceString: formatMoney(p.priceUsd, {
        currency,
        decimals: p.cadence === 'lifetime' ? 0 : 2,
      }),
      cadenceSuffix: suffixFor(p.cadence),
      subtitle:
        p.cadence === 'monthly'
          ? 'Cancel anytime'
          : p.cadence === 'yearly'
            ? `Just ${formatMoney(p.priceUsd / 12, { currency })} / mo · save 50%`
            : 'Pay once, keep forever',
      introCopy: p.cadence !== 'lifetime' ? '7 days free' : undefined,
    }));
  }, [offerings, currency]);

  const usingRealOfferings = offerings.length > 0;
  const defaultPlanId = useMemo(() => {
    const yearly = plans.find((p) => p.cadence === 'yearly');
    return yearly?.identifier ?? plans[0]?.identifier ?? '';
  }, [plans]);
  const [planId, setPlanId] = useState<string>(defaultPlanId);

  // If offerings load after mount, snap selection to the (now valid) default.
  useEffect(() => {
    if (!plans.some((p) => p.identifier === planId) && defaultPlanId) {
      setPlanId(defaultPlanId);
    }
  }, [plans, planId, defaultPlanId]);

  const selectedPlan = plans.find((p) => p.identifier === planId) ?? plans[0];

  // Paywall view is the most important conversion event — fire on mount.
  useEffect(() => {
    events.paywallViewed();
  }, []);

  // Guest auth-gate. Guests should never land on the purchase screen
  // directly — entitlements must map to a Supabase user. Redirect to the
  // upsell explainer, which routes them through sign-up/sign-in and back
  // here. We wait for auth state to hydrate so a returning Plus user
  // doesn't get bounced on cold start. Placed after all hooks to keep
  // hook order stable across renders.
  if (!authLoading && !user) {
    return <Redirect href={'/auth/upsell?next=/premium' as never} />;
  }

  const onPurchase = async () => {
    if (!selectedPlan) return;
    if (!usingRealOfferings) {
      // No store-backed offerings available — dev mode without RC keys.
      Alert.alert(
        'Paywall not configured',
        'RevenueCat keys are not set in this environment. Configure EXPO_PUBLIC_REVENUECAT_KEY_IOS / _ANDROID to enable purchases.',
      );
      return;
    }
    setPurchasing(true);
    const res = await purchase(selectedPlan.identifier);
    setPurchasing(false);
    if (res.purchased) {
      router.back();
      return;
    }
    if (res.error && !/cancel/i.test(res.error)) {
      Alert.alert('Purchase failed', res.error);
    }
  };

  const onRestore = async () => {
    setRestoring(true);
    const res = await restorePurchases();
    setRestoring(false);
    if (res.error) {
      Alert.alert('Restore failed', res.error);
      return;
    }
    // Success path: the global paywall state will flip isPremium on its own.
    // Surface a confirmation so the user knows the tap did something.
    Alert.alert('Restore complete', 'Your purchases have been restored.');
  };

  const ctaLabel =
    selectedPlan?.cadence === 'lifetime'
      ? 'Become a Founding Member'
      : selectedPlan?.introCopy
        ? 'Start Free Trial'
        : 'Continue';

  const fineprint = selectedPlan
    ? selectedPlan.cadence === 'lifetime'
      ? `${selectedPlan.priceString} once · no recurring billing`
      : selectedPlan.introCopy
        ? `${selectedPlan.introCopy} · then ${selectedPlan.priceString} ${selectedPlan.cadenceSuffix} · cancel anytime`
        : `${selectedPlan.priceString} ${selectedPlan.cadenceSuffix} · cancel anytime`
    : '';

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
        <Pressable
          hitSlop={8}
          onPress={onRestore}
          disabled={restoring}
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
        >
          <Text style={[styles.restore, restoring && { opacity: 0.5 }]}>
            {restoring ? 'Restoring…' : 'Restore'}
          </Text>
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

        <View style={styles.unlockSection}>
          <Text style={styles.unlockTitle}>What you unlock</Text>
          <View style={styles.unlockList}>
            {UNLOCK_ITEMS.map((item) => (
              <Text key={item} style={styles.unlockItem}>
                ✓ {item}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.unlockTitle}>Premium preview</Text>
          <View style={styles.previewCard}>
            <Image source={PREMIUM_PREVIEW.image} style={styles.previewImage} />
            <View style={styles.previewOverlay} />
            <View style={styles.previewContent}>
              <Text style={styles.previewBadge}>Premium</Text>
              <Text style={styles.previewHeroTitle}>{PREMIUM_PREVIEW.title}</Text>
              <Text style={styles.previewSubtitle}>{PREMIUM_PREVIEW.subtitle}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose your PureCraft plan</Text>
        <View style={styles.plans}>
          {plans.map((p) => {
            const isActive = planId === p.identifier;
            return (
              <Pressable
                key={p.identifier}
                onPress={() => setPlanId(p.identifier)}
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
                  <Text style={styles.planSub}>{p.subtitle}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.planPrice}>{p.priceString}</Text>
                  <Text style={styles.planCadence}>{p.cadenceSuffix}</Text>
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
          label={ctaLabel}
          trailingIcon="arrow-forward"
          loading={purchasing || paywallLoading}
          disabled={!selectedPlan}
          onPress={onPurchase}
        />
        <Text style={styles.fineprint}>{fineprint}</Text>
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

  unlockSection: { marginTop: 24 },
  previewSection: { marginTop: 28 },
  unlockTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    color: Colors.light.sageDeep,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  unlockList: { gap: 10 },
  unlockItem: { fontSize: 16, color: Colors.light.text, lineHeight: 22 },
  previewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 180,
    marginTop: 4,
  },
  previewImage: { width: '100%', height: '100%' },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  previewContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  previewBadge: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  previewHeroTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  previewSubtitle: { fontSize: 14, color: '#E5E7EB', marginTop: 2 },
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

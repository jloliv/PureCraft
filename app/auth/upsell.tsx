// Auth-gate explainer for guests trying to enter the premium purchase
// flow. Sits between any "Upgrade" CTA and /premium when the user is
// signed out. Routed to via useRequirePremium() in lib/premium-gate.ts.
//
// Friendly framing, not forced-auth wording — premium purchase is the
// only thing actually gated. Guests retain full app functionality
// behind this screen; this is only on the path to a subscription.

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  ivory: '#F8F5EF',
  surface: '#FFFFFF',
  border: '#E8E2D2',
  borderSoft: '#EFE9DA',
  sage: '#5F876A',
  sageDeep: '#4A6E55',
  sageSoft: '#E4EDE5',
  deep: '#1F2420',
  muted: '#6F6A60',
  textSubtle: '#9B958B',
};

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'sparkles-outline', text: 'Unlock all 120+ premium recipes' },
  { icon: 'bookmark-outline', text: 'Unlimited saves and collections' },
  { icon: 'scan-outline', text: 'Unlimited label + pantry scans' },
  { icon: 'sync-outline', text: 'Sync recipes across your devices' },
];

export default function UpsellScreen() {
  const params = useLocalSearchParams<{ next?: string }>();
  const next = typeof params.next === 'string' ? params.next : '/premium';
  const nextQs = `?next=${encodeURIComponent(next)}`;

  const handleSignUp = () => {
    router.replace(`/auth/sign-up${nextQs}` as never);
  };

  const handleSignIn = () => {
    router.replace(`/auth/sign-in${nextQs}` as never);
  };

  const handleDismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home' as never);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.handle} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          onPress={handleDismiss}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="close" size={20} color={COLORS.deep} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={28} color={COLORS.sage} />
        </View>

        <Text style={styles.eyebrow}>PURECRAFT+</Text>
        <Text style={styles.title}>Save your Plus membership to your account</Text>
        <Text style={styles.sub}>
          Create your free PureCraft account to start your Plus membership
          and sync recipes across devices.
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <View style={styles.benefitDot}>
                <Ionicons name={b.icon} size={14} color={COLORS.sage} />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleSignUp}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={['#7E9A7F', '#5F876A', '#4A6E55']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryGradient}
          >
            <Text style={styles.primaryText}>Create free account</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleSignIn}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.secondaryText}>I already have an account</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={handleDismiss}
          style={styles.dismissBtn}
        >
          <Text style={styles.dismissText}>Not now</Text>
        </Pressable>

        <Text style={styles.legal}>
          Your account is free. PureCraft+ is an optional subscription you
          can cancel anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.ivory },
  topBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.borderSoft,
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -19,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: COLORS.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '700',
    color: COLORS.sage,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: COLORS.deep,
    letterSpacing: -0.6,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  sub: {
    fontSize: 14.5,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  benefits: {
    width: '100%',
    gap: 12,
    marginTop: 26,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: COLORS.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 14.5,
    color: COLORS.deep,
    fontWeight: '500',
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: COLORS.sageDeep,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
  },
  primaryText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.sageDeep,
    letterSpacing: 0.2,
    textDecorationLine: 'underline',
  },
  dismissBtn: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dismissText: {
    fontSize: 13,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
  legal: {
    fontSize: 11.5,
    lineHeight: 16,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginTop: 22,
    paddingHorizontal: 12,
  },
});

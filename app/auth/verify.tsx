// Email verification landing — destination of the magic link Supabase
// sends after sign-up when "Confirm email" is enabled in the dashboard.
//
// The link looks like `purecraft://auth/verify?...` and arrives with a
// hash fragment that Supabase's web detector would normally parse. On
// native we opted out (`detectSessionInUrl: false` in lib/supabase.ts)
// because the parser is web-only — instead the click into the app
// triggers a sign-in via the link's embedded token, supabase-js fires
// SIGNED_IN through onAuthStateChange, and we just need to wait for
// the session to land and then route home.
//
// If the session never lands within a short window (link expired,
// malformed, etc.) we fall through to sign-in so the user has a path
// forward instead of staring at a spinner.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setOnboardingComplete } from '@/lib/onboarding-storage';
import { useAuth } from '@/lib/auth';

const COLORS = {
  ivory: '#F8F5EF',
  sage: '#5F876A',
  sageSoft: '#E8F0E9',
  deep: '#1F2420',
  muted: '#746F68',
};

const FALLBACK_MS = 6000;

export default function Verify() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      // Session is live — promote onto the main app. Mark onboarding
      // complete so the next cold start doesn't kick the user back
      // through intro screens.
      setOnboardingComplete(true);
      router.replace('/home');
      return;
    }
    if (loading) return;

    // No session and auth has finished hydrating — give supabase-js a
    // short grace window (the URL parser is async) before falling back
    // to sign-in.
    const t = setTimeout(() => {
      router.replace('/auth/sign-in');
    }, FALLBACK_MS);
    return () => clearTimeout(t);
  }, [user, loading]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconHero}>
          <Ionicons name="checkmark-circle" size={26} color={COLORS.sage} />
        </View>
        <Text style={styles.headline}>Confirming your email</Text>
        <Text style={styles.sub}>Hang tight — signing you in.</Text>
        <ActivityIndicator color={COLORS.sage} style={{ marginTop: 24 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.ivory },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconHero: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: COLORS.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.deep,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 10,
  },
});

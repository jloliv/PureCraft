// App entry — splash gate. Holds for ~1.4s while the logo fades in,
// then routes:
//   first launch  → /onboarding/intro
//   returning user → /home
//
// Animation philosophy (per design refinement):
//   Quieter is more premium. Removed the prior overshoot (0.85→1.05)
//   and sage glow pulse — both read as "extra" rather than
//   intentional. What's left is the minimal motion that still feels
//   like an entrance:
//     0.00s         (first frame is the calm beige base)
//     0.00→0.40s    background gradient fades in
//     0.15→0.85s    logo: opacity 0→1, scale 0.96→1.0  ← the splash
//     0.90→1.20s    tagline fades in (delayed so it doesn't crowd
//                                     the logo's beat)
//     1.40s         route to next screen
//
// 150ms initial delay on the logo keeps the entry from feeling
// abrupt; the 0.96→1.0 scale is small enough that it reads as
// "settling into place" rather than "growing." No bounce, no spin,
// no harsh easing.

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  isOnboardingComplete,
  onboardingHydrated,
} from '@/lib/onboarding-storage';
import { supabase, supabaseConfigured } from '@/lib/supabase';

// Total time the splash stays on screen end-to-end. Sits inside the
// "1.2–1.5s" sweet spot — long enough for the logo to register, short
// enough to never feel like a load screen.
const HOLD_MS = 1400;
const LOGO = require('../assets/images/PureCraftLogo.png');

export default function SplashGate() {
  const bgOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.96);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // Background — quick subtle fade so the first frame doesn't flash
    // a different color than the gradient resolves to.
    bgOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });

    // Logo — the entire splash, basically. 150ms delay smooths the
    // entry; 700ms fade is the spec's center value. Scale tracks the
    // opacity duration so the two finish together.
    logoOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    logoScale.value = withDelay(
      150,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );

    // Tagline — fades in AFTER the logo settles, so the eye isn't
    // forced to track two simultaneous motions. Short fade keeps it
    // out of the way.
    taglineOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );

    // Route once BOTH conditions are met:
    //   • The minimum splash hold has elapsed (so the animation doesn't
    //     get clipped on a hot cache).
    //   • Persistent state has hydrated:
    //       - onboarding completion flag (AsyncStorage round-trip)
    //       - Supabase session (auth getSession round-trip)
    //
    // Without the second wait, a returning signed-in user could be
    // routed to /onboarding/intro for a frame before the session
    // resolves — visible flash, broken-feeling. The hold timer fires
    // immediately in parallel so a fast cold start still hits ~1.4s.
    let cancelled = false;
    const hold = new Promise<void>((resolve) => setTimeout(resolve, HOLD_MS));
    // If supabase isn't configured (e.g. local dev without env vars) we
    // skip the session probe entirely and let the onboarding flag alone
    // decide. Otherwise we ask Supabase to surface its rehydrated
    // session — auth.ts has already kicked off its own getSession() at
    // module load, so this resolves quickly on warm caches.
    const sessionReady: Promise<unknown> = supabaseConfigured && supabase
      ? supabase.auth.getSession()
      : Promise.resolve(null);

    void Promise.all([hold, onboardingHydrated, sessionReady]).then(
      async () => {
        if (cancelled) return;
        const complete = isOnboardingComplete();
        // A signed-in user always lands on /home — the session is the
        // strongest signal that they've used the app before, and routing
        // them through onboarding would be a regression. A signed-out
        // user falls back to the onboarding-complete flag.
        let hasSession = false;
        if (supabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          hasSession = !!data.session;
        }
        router.replace(hasSession || complete ? '/home' : '/onboarding/intro');
      },
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Solid base color guards against a flash of white before the
          gradient resolves. The animated gradient sits on top and
          crossfades to the warm cream tone. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFBF4' }]} />
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <LinearGradient
          colors={['#FFFBF4', '#F2EAD8']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.content}>
        <Animated.View style={logoStyle}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Clean. Natural. Made by you.
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 22,
  },
  logo: { width: 240, height: 200 },
  tagline: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#6F6A60',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

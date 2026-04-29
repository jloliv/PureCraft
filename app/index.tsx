import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isOnboardingComplete } from '@/lib/onboarding-storage';

// App entry — splash logo screen. Holds for ~1.6s then routes:
//   first launch  → /onboarding/intro
//   returning user → /home
//
// The actual home content lives at /home so this entry stays a thin gate.

const HOLD_MS = 1600;
const LOGO = require('../assets/images/PureCraftLogo.png');

export default function SplashGate() {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      const complete = isOnboardingComplete();
      router.replace(complete ? '/home' : '/onboarding/intro');
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [fade, lift]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#FFFBF4', '#F2EAD8']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Animated.View
          style={{ opacity: fade, transform: [{ translateY: lift }], alignItems: 'center', gap: 18 }}
        >
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tagline}>Clean. Natural. Made by you.</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logo: { width: 240, height: 200 },
  tagline: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#6F6A60',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});

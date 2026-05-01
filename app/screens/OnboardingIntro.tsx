import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { tapLight } from '@/lib/haptics';
import { setOnboardingComplete } from '@/lib/onboarding-storage';

const HERO = require('../../assets/images/welcome-hero.png');

type Props = {
  navigation?: {
    navigate: (route: string) => void;
  };
  onGetStarted?: () => void;
};

export default function OnboardingIntro({ navigation, onGetStarted }: Props) {
  const heroFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentLift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 720,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 620,
        delay: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentLift, {
        toValue: 0,
        duration: 760,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentFade, contentLift, heroFade]);

  const handleGetStarted = () => {
    tapLight();
    if (onGetStarted) {
      onGetStarted();
      return;
    }
    if (navigation) {
      navigation.navigate('OnboardingStep1');
      return;
    }
    router.push('/onboarding/intent');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.heroWrap, { opacity: heroFade }]}>
        <Image source={HERO} style={styles.hero} resizeMode="cover" />
      </Animated.View>

      <LinearGradient
        colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.54)']}
        locations={[0, 0.45, 1]}
        style={styles.overlay}
      />

      <Animated.View
        style={[
          styles.content,
          { opacity: contentFade, transform: [{ translateY: contentLift }] },
        ]}
      >
        <Text style={styles.title}>Create your own{'\n'}clean products</Text>

        <Text style={styles.subtitle}>
          Simple, natural recipes for your home, body, and daily life.
        </Text>

        <TouchableOpacity
          activeOpacity={0.88}
          accessibilityRole="button"
          style={styles.button}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* DEV-ONLY: bypass onboarding for faster iteration. Stripped from
          production builds because the entire JSX is gated by __DEV__,
          which Metro statically replaces with `false` on release. */}
      {__DEV__ ? (
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding (dev only)"
          style={styles.devSkipButton}
          onPress={() => {
            // Persist completion so the splash gate (app/index.tsx) sends
            // us straight to /home on the next launch instead of bouncing
            // back to /onboarding/intro.
            setOnboardingComplete(true);
            router.replace('/home');
          }}
        >
          <Text style={styles.devSkipText}>Skip Onboarding (DEV)</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  heroWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  hero: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 34,
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#EAEAEA',
    marginTop: 12,
    lineHeight: 22,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#5F876A',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // DEV-ONLY skip pill. Top-right so it never overlaps with the real
  // "Get Started" CTA at the bottom. Clearly labeled and visually
  // distinct (solid black pill) so nobody mistakes it for production UI.
  // Search "Skip Onboarding" to find / remove this before launch.
  devSkipButton: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    opacity: 0.8,
  },
  devSkipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});

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
});

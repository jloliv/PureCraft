import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BACKGROUND_PRIMARY, Fonts } from '@/constants/theme';

const LOGO = require('../../assets/images/PureCraftLogo.png');

const COLORS = {
  paper: BACKGROUND_PRIMARY,
  paperWarm: BACKGROUND_PRIMARY,
  glow: 'rgba(255, 250, 242, 0.92)',
  sageTint: 'rgba(123, 158, 137, 0.18)',
  sage: '#6E8C77',
  sageDeep: '#4E6656',
  ink: '#1E221E',
  muted: '#7F796D',
  subtle: '#A49A8B',
  border: 'rgba(108, 95, 76, 0.12)',
  ctaShadow: 'rgba(78, 102, 86, 0.24)',
};

export default function Welcome() {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;
  const logoScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 950,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, lift, logoScale]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[COLORS.paper, COLORS.paper, COLORS.paperWarm]}
        locations={[0, 0.48, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View pointerEvents="none" style={styles.ambientTop}>
        <LinearGradient
          colors={[COLORS.glow, 'rgba(255,250,242,0.12)', 'transparent']}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.ambientGlow}
        />
      </View>

      <View pointerEvents="none" style={styles.ambientOrbWrap}>
        <LinearGradient
          colors={[COLORS.sageTint, 'rgba(123,158,137,0.03)', 'transparent']}
          locations={[0, 0.58, 1]}
          start={{ x: 0.5, y: 0.2 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.ambientOrb}
        />
      </View>

      <View pointerEvents="none" style={styles.frame}>
        <View style={styles.frameLineTop} />
        <View style={styles.frameLineBottom} />
      </View>

      <Animated.View
        style={[
          styles.container,
          { opacity: fade, transform: [{ translateY: lift }] },
        ]}
      >
        <Animated.View
          style={[
            styles.logoWrap,
            { transform: [{ scale: logoScale }] },
          ]}
        >
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Elevated everyday essentials</Text>
          <Text style={styles.headline}>Make everything{`\n`}you use feel cleaner.</Text>
          <Text style={styles.sub}>
            Thoughtfully crafted recipes for home, body, and routine. Fewer
            ingredients. More beauty in the everyday.
          </Text>
        </View>

        <View style={styles.bottom}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get started"
            onPress={() => router.push('/onboarding/region')}
            style={({ pressed }) => [
              styles.ctaWrap,
              pressed && styles.ctaWrapPressed,
            ]}
          >
            <LinearGradient
              colors={[COLORS.sage, COLORS.sageDeep]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Begin your routine</Text>
              <Ionicons name="arrow-forward" size={18} color="#F9F6EF" />
            </LinearGradient>
          </Pressable>

          <Pressable
            hitSlop={10}
            onPress={() => router.push('/auth/sign-in')}
            style={({ pressed }) => [
              styles.account,
              pressed && { opacity: 0.56 },
            ]}
          >
            <Text style={styles.accountText}>I already have an account</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  ambientTop: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ambientGlow: {
    width: 420,
    height: 320,
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 180,
    opacity: 0.95,
  },
  ambientOrbWrap: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ambientOrb: {
    width: 334,
    height: 334,
    borderRadius: 999,
  },
  frame: {
    position: 'absolute',
    top: 24,
    left: 22,
    right: 22,
    bottom: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 32,
  },
  frameLineTop: {
    position: 'absolute',
    top: 22,
    left: 22,
    right: 22,
    height: 1,
    backgroundColor: 'rgba(108, 95, 76, 0.08)',
  },
  frameLineBottom: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 22,
    height: 1,
    backgroundColor: 'rgba(108, 95, 76, 0.08)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 34,
    paddingTop: 56,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoWrap: {
    width: '100%',
    maxWidth: 300,
    height: 188,
    marginTop: 18,
    marginBottom: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 248,
    height: 168,
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  eyebrow: {
    marginBottom: 16,
    color: COLORS.sageDeep,
    fontSize: 11.5,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  headline: {
    color: COLORS.ink,
    textAlign: 'center',
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1.05,
    fontWeight: '500',
    fontFamily: Fonts?.serif,
  },
  sub: {
    marginTop: 18,
    maxWidth: 300,
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 15.5,
    lineHeight: 25,
    letterSpacing: 0.1,
  },
  bottom: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
  },
  ctaWrap: {
    width: '100%',
    shadowColor: COLORS.ctaShadow,
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  ctaWrapPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.992 }],
  },
  cta: {
    width: '100%',
    height: 60,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  ctaText: {
    color: '#F9F6EF',
    fontSize: 15.5,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  account: {
    marginTop: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  accountText: {
    color: COLORS.subtle,
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
});

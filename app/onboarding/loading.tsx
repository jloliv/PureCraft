import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BACKGROUND_PRIMARY } from '@/constants/theme';

const LOGO = require('../../assets/images/logo-leaf.png');

const PALETTE = {
  bg: BACKGROUND_PRIMARY,
  text: '#1F1F1F',
  textMuted: '#6B6B6B',
  textSubtle: '#8A8A8A',
  surface: 'rgba(255,255,255,0.5)',
  surfaceWarm: 'rgba(255,255,255,0.5)',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: 'rgba(255,255,255,0.5)',
  creamDeep: 'rgba(0,0,0,0.06)',
  gold: '#C7A96B',
};

const STAGES = [
  { icon: 'reader-outline' as const, label: 'Reading your preferences' },
  { icon: 'flask-outline' as const, label: 'Pairing safe ingredients' },
  { icon: 'shield-checkmark-outline' as const, label: 'Tuning for your household' },
  { icon: 'sparkles-outline' as const, label: 'Personalizing your feed' },
];

export default function OnboardingLoading() {
  const [stage, setStage] = useState(0);
  const breathe = useRef(new Animated.Value(0)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.timing(ringSpin, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
    // Subtle logo pulse — 98% → 102%, slow and even. Makes the leaf feel
    // alive without competing with the dashed ring's rotation.
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
    // One-time fade-in on mount so the leaf settles into place.
    Animated.timing(fade, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [breathe, ringSpin, glow, fade, logoPulse]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 800);
    const finish = setTimeout(() => {
      router.replace('/onboarding/results');
    }, 3400);
    return () => {
      clearInterval(interval);
      clearTimeout(finish);
    };
  }, []);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const rotate = ringSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.6] });
  const logoScale = logoPulse.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[PALETTE.bg, PALETTE.bg, PALETTE.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.body}>
        <View style={styles.orbWrap}>
          <Animated.View
            style={[
              styles.softGlow,
              { opacity: glowOpacity, transform: [{ scale }] },
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.5)', '#E4EDE5', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />
          <Animated.Image
            source={LOGO}
            resizeMode="contain"
            style={[
              styles.logo,
              { opacity: fade, transform: [{ scale: logoScale }] },
            ]}
          />
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Almost there</Text>
          <Text style={styles.title}>Creating your{`\n`}PureCraft Profile</Text>
          <Text style={styles.sub}>
            Mixing your preferences into a recipe library only you would get.
          </Text>
        </View>

        <View style={styles.stages}>
          {STAGES.map((s, i) => {
            const isDone = i < stage;
            const isActive = i === stage;
            return (
              <View key={s.label} style={styles.stageRow}>
                <View
                  style={[
                    styles.stageIcon,
                    isActive && styles.stageIconActive,
                    isDone && styles.stageIconDone,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name={s.icon}
                      size={13}
                      color={isActive ? '#FFFFFF' : PALETTE.textSubtle}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stageLabel,
                    isActive && styles.stageLabelActive,
                    isDone && styles.stageLabelDone,
                  ]}
                >
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.footnote}>Just a few seconds…</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 20 },

  orbWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  softGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 120,
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.2,
    borderColor: PALETTE.sageDeep,
    borderStyle: 'dashed',
    opacity: 0.35,
  },
  logo: { width: 84, height: 84 },

  copy: { alignItems: 'center', gap: 6 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.6,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    color: PALETTE.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },

  stages: { marginTop: 18, gap: 10, alignSelf: 'stretch' },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stageIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIconActive: { backgroundColor: PALETTE.sageDeep, borderColor: PALETTE.sageDeep },
  stageIconDone: { backgroundColor: PALETTE.sage, borderColor: PALETTE.sage },
  stageLabel: { fontSize: 13, color: PALETTE.textSubtle },
  stageLabelActive: { color: PALETTE.text, fontWeight: '600' },
  stageLabelDone: { color: PALETTE.textMuted },

  footnote: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 0.5,
    color: PALETTE.textMuted,
    paddingBottom: 22,
  },
});

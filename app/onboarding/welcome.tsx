import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#1F1F1F',
  textMuted: '#6F6A60',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  surfaceWarm: '#F1ECE0',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
};

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export default function Welcome() {
  const breathe = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [breathe, fade]);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const glow = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.View style={[styles.page, { opacity: fade }]}>
        <View style={styles.markWrap}>
          <Animated.View style={[styles.glow, { opacity: glow, transform: [{ scale }] }]}>
            <LinearGradient
              colors={['#E4EDE5', '#F7F2E7', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <View style={styles.markRing}>
            <Ionicons name="leaf" size={32} color={PALETTE.sageDeep} />
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Welcome</Text>
          <Text style={styles.brand}>PURECRAFT</Text>
          <Text style={styles.sub}>
            Craft products designed for your home,{`\n`}body, and lifestyle.
          </Text>
        </View>

        <View style={styles.featureRow}>
          <Feature icon="sparkles-outline" label="Personalized" />
          <View style={styles.featureDot} />
          <Feature icon="shield-checkmark-outline" label="Family-safe" />
          <View style={styles.featureDot} />
          <Feature icon="leaf-outline" label="Clean" />
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Get started"
            trailingIcon="arrow-forward"
            onPress={() => router.push('/onboarding/region')}
          />
          <Pressable hitSlop={10} onPress={() => router.replace('/')}>
            <Text style={styles.signinLink}>I already have an account</Text>
          </Pressable>
          <Text style={styles.footnote}>Takes less than 60 seconds</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

function Feature({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={14} color={PALETTE.sageDeep} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  page: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },

  markWrap: {
    marginTop: 60,
    alignSelf: 'center',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  markRing: {
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  copy: { alignItems: 'center', gap: 10, marginBottom: 6 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 3.5,
    fontWeight: '600',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  brand: {
    fontFamily: SERIF,
    fontSize: 42,
    letterSpacing: 6,
    color: PALETTE.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  sub: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: PALETTE.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  featureRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: PALETTE.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 12, color: PALETTE.text, fontWeight: '600' },
  featureDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: PALETTE.textSubtle },

  footer: { paddingBottom: 8, gap: 14, alignItems: 'center' },
  signinLink: { fontSize: 13, color: PALETTE.textMuted, fontWeight: '500' },
  footnote: { fontSize: 11, color: PALETTE.textSubtle, letterSpacing: 0.5 },
});

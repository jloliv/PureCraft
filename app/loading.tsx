import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { findProduct } from '@/constants/products';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

const STAGES = [
  { icon: 'reader-outline' as const, label: 'Reading your preferences' },
  { icon: 'flask-outline' as const, label: 'Mixing your formula' },
  { icon: 'shield-checkmark-outline' as const, label: 'Checking safety' },
  { icon: 'sparkles-outline' as const, label: 'Polishing the recipe' },
];

export default function Loading() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const product = findProduct(id);
  const [stage, setStage] = useState(0);

  const pulse = useRef(new Animated.Value(0)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.timing(ringSpin, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [pulse, ringSpin]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 700);
    const finish = setTimeout(() => {
      router.replace({ pathname: '/result', params: { id: product.id } });
    }, 2800);
    return () => {
      clearInterval(interval);
      clearTimeout(finish);
    };
  }, [product.id]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const rotate = ringSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#FFFFFF', '#F2EFE7']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.orbWrap}>
          <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />
          <Animated.View style={[styles.orb, { transform: [{ scale }] }]}>
            <LinearGradient
              colors={['#7B9E89', '#5C7F6B']}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.orbEmoji}>{product.emoji}</Text>
          </Animated.View>
        </View>

        <Text style={styles.eyebrow}>Crafting your formula</Text>
        <Text style={styles.title}>{product.title}</Text>

        <View style={styles.stageList}>
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
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name={s.icon}
                      size={14}
                      color={isActive ? '#FFFFFF' : Colors.light.textSubtle}
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

      <Text style={styles.footnote}>This usually takes a few seconds.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  orbWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: Colors.light.sage,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  orb: {
    width: 140,
    height: 140,
    borderRadius: 80,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.raised,
  },
  orbEmoji: { fontSize: 56 },
  eyebrow: { ...Type.caption, color: Colors.light.sageDeep, textTransform: 'uppercase' },
  title: { ...Type.title, color: Colors.light.text, textAlign: 'center' },
  stageList: { marginTop: Spacing.xl, gap: Spacing.md, alignSelf: 'stretch' },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stageIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIconActive: { backgroundColor: Colors.light.sageDeep, borderColor: Colors.light.sageDeep },
  stageIconDone: { backgroundColor: Colors.light.sage, borderColor: Colors.light.sage },
  stageLabel: { ...Type.body, color: Colors.light.textSubtle },
  stageLabelActive: { color: Colors.light.text, fontWeight: '600' },
  stageLabelDone: { color: Colors.light.textMuted },
  footnote: {
    ...Type.caption,
    color: Colors.light.textMuted,
    paddingBottom: Spacing.xl,
  },
});

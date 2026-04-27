import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Type } from '@/constants/theme';

type PermKey = 'camera' | 'notifications' | 'pantry' | 'photos' | 'analytics';

type Perm = {
  key: PermKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  why: string;
  used: string;
};

const PERMS: Perm[] = [
  {
    key: 'camera',
    icon: 'camera-outline',
    title: 'Camera',
    why: 'Used only when you tap "Scan product" to recreate a store-bought formula. Photos stay on-device — nothing is uploaded.',
    used: 'Off by default',
  },
  {
    key: 'notifications',
    icon: 'notifications-outline',
    title: 'Notifications',
    why: 'Gentle reminders for recipes you’ve started, weekly picks, and safety alerts when ingredients are low. You set the cadence.',
    used: 'Daily summary',
  },
  {
    key: 'pantry',
    icon: 'restaurant-outline',
    title: 'Pantry access',
    why: 'Lets PureCraft suggest recipes based on what you already have and warn you before you double-buy.',
    used: '7 ingredients tracked',
  },
  {
    key: 'photos',
    icon: 'images-outline',
    title: 'Photo library',
    why: 'Optional — used only if you choose to add a photo to a recipe you saved. PureCraft never reads your library in the background.',
    used: 'Off by default',
  },
  {
    key: 'analytics',
    icon: 'pulse-outline',
    title: 'Usage analytics',
    why: 'Anonymized signals help us see which features land. No location, no contacts, no advertising identifiers.',
    used: 'Aggregated only',
  },
];

const DEFAULTS: Record<PermKey, boolean> = {
  camera: false,
  notifications: true,
  pantry: true,
  photos: false,
  analytics: true,
};

export default function Permissions() {
  const [granted, setGranted] = useState<Record<PermKey, boolean>>(DEFAULTS);
  const set = (k: PermKey) => (v: boolean) => setGranted((p) => ({ ...p, [k]: v }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topTitle}>Data &amp; Permissions</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrap}>
          <Text style={styles.eyebrow}>PERMISSIONS</Text>
          <Text style={styles.title}>What PureCraft can access</Text>
          <Text style={styles.intro}>
            Each permission is opt-in. Turn anything off and the app keeps working — you’ll just see fewer
            tailored suggestions.
          </Text>
        </View>

        <View style={styles.list}>
          {PERMS.map((p, i) => (
            <View key={p.key} style={[styles.row, i === 0 && { borderTopWidth: 0 }]}>
              <View style={styles.iconWrap}>
                <Ionicons name={p.icon} size={18} color={Colors.light.sageDeep} />
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowTitle}>{p.title}</Text>
                  <Switch
                    value={granted[p.key]}
                    onValueChange={set(p.key)}
                    trackColor={{ false: Colors.light.surfaceAlt, true: Colors.light.sage }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={Colors.light.surfaceAlt}
                  />
                </View>
                <Text style={styles.rowWhy}>{p.why}</Text>
                <View style={styles.usedPill}>
                  <View style={styles.usedDot} />
                  <Text style={styles.usedText}>{p.used}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.linkRow}>
          <Pressable
            onPress={() => router.push('/privacy')}
            style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="lock-closed-outline" size={14} color={Colors.light.sageDeep} />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.light.textSubtle} />
          </Pressable>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { ...Type.bodyStrong, color: Colors.light.text },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },

  headerWrap: { paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: Colors.light.sageDeep,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.7,
  },
  intro: {
    fontSize: 13.5,
    lineHeight: 20,
    color: Colors.light.textMuted,
    marginTop: 10,
  },

  list: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowBody: { flex: 1, gap: 6 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.2,
    flex: 1,
  },
  rowWhy: {
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.light.textMuted,
  },
  usedPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.light.sageSoft,
    marginTop: 4,
  },
  usedDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.light.sageDeep,
  },
  usedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.light.sageDeep,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  linkRow: { marginTop: Spacing.xl, alignItems: 'center' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
  },
  linkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: 0.2,
  },
});

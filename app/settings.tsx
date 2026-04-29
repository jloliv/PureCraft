import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCurrency } from '@/constants/currency';
import { signOut, useAuth } from '@/lib/auth';
import { tapLight, tapSoft, warning } from '@/lib/haptics';
import { useOnboardingAnswers } from '@/lib/onboarding-answers';
import { setOnboardingComplete } from '@/lib/onboarding-storage';
import { useProfile } from '@/lib/profile';
import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

// Display-label mappings for keys captured during onboarding. Keep in sync
// with the labels used in the onboarding screens themselves.
const INTENT_LABELS: Record<string, string> = {
  'safer-cleaning': 'Safer Cleaning',
  'better-skin-care': 'Better Skin Care',
  'luxury-home-scents': 'Luxury Home Scents',
  'save-money': 'Save Money',
  'allergy-friendly': 'Allergy Friendly',
  'eco-living': 'Eco Living',
  'diy-beauty': 'DIY Beauty',
  'wellness-routines': 'Wellness Routines',
  'create-recipes': 'Create & Save Recipes',
};

const HOUSEHOLD_LABELS: Record<string, string> = {
  baby: 'Babies',
  young: 'Young Children',
  older: 'Older Children',
  teens: 'Teens',
  pets: 'Pets',
  adults: 'Just Adults',
  elderly: 'Elderly Family',
};

// Render selected keys as a comma-separated label list, capped at MAX with a
// "+N" overflow tail. Returns "Not configured" when nothing is selected.
function formatSelected(
  keys: string[] | undefined,
  labels: Record<string, string>,
  max = 2,
): string {
  const resolved = (keys ?? [])
    .map((k) => labels[k] ?? k)
    .filter(Boolean);
  if (resolved.length === 0) return 'Not configured';
  if (resolved.length <= max) return resolved.join(', ');
  return `${resolved.slice(0, max).join(', ')} +${resolved.length - max}`;
}

type ToggleKey = 'notifications' | 'safetyAlerts' | 'haptics' | 'metric';

const APP_VERSION = '1.0.0 · build 1';

export default function Settings() {
  const { currency } = useCurrency();
  const { user } = useAuth();
  const { profile } = useProfile();
  const localAnswers = useOnboardingAnswers();
  // Profile (when signed-in) is canonical; local buffer covers guest mode.
  const intentKeys =
    profile?.intent_categories?.length
      ? profile.intent_categories
      : localAnswers.intent_categories;
  const householdKeys =
    profile?.household?.length ? profile.household : localAnswers.household;
  const intentSubtitle = formatSelected(intentKeys, INTENT_LABELS);
  const householdSubtitle = formatSelected(householdKeys, HOUSEHOLD_LABELS);
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    notifications: true,
    safetyAlerts: true,
    haptics: true,
    metric: false,
  });

  const setToggle = (key: ToggleKey) => (value: boolean) => {
    tapLight();
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

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
        <Text style={styles.topTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user
                ? (user.email ?? 'PC').slice(0, 2).toUpperCase()
                : 'PC'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>
              {user ? user.email?.split('@')[0] ?? 'Member' : 'Guest'}
            </Text>
            <Text style={styles.profileMeta}>
              {user ? user.email : 'Sign in to sync across devices'}
            </Text>
          </View>
          {user ? (
            <Pressable
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
              onPress={() => {}}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/auth/sign-in')}
            >
              <Text style={styles.editBtnText}>Sign in</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.planCard, pressed && { transform: [{ scale: 0.99 }] }]}
          onPress={() => {
            tapSoft();
            router.push('/premium');
          }}
        >
          <View style={styles.planLeft}>
            <View style={styles.planBadge}>
              <Ionicons name="sparkles" size={14} color={Colors.light.sageDeep} />
              <Text style={styles.planBadgeText}>Free plan</Text>
            </View>
            <Text style={styles.planTitle}>Upgrade to PureCraft+</Text>
            <Text style={styles.planSub}>Unlimited recipes & family profiles</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color={Colors.light.sageDeep} />
        </Pressable>

        <Section title="Household">
          <Row
            icon="people-outline"
            title="Household profile"
            sub={householdSubtitle}
            onPress={() => router.push('/onboarding/household')}
          />
          <Row
            icon="leaf-outline"
            title="Default preferences"
            sub={intentSubtitle}
            onPress={() => router.push('/onboarding/intent')}
          />
          <Row
            icon="restaurant-outline"
            title="Pantry"
            sub="7 ingredients on hand"
            onPress={() => router.push('/pantry')}
            isLast
          />
        </Section>

        <Section title="Preferences">
          <Row
            icon="cash-outline"
            title="Currency"
            sub={`${currency.flag}  ${currency.name} · ${currency.code} (${currency.symbol})`}
            onPress={() => router.push('/currency')}
            isLast
          />
        </Section>

        <Section title="App">
          <ToggleRow
            icon="notifications-outline"
            title="Notifications"
            sub="New recipes & gentle reminders"
            value={toggles.notifications}
            onChange={setToggle('notifications')}
          />
          <ToggleRow
            icon="shield-checkmark-outline"
            title="Safety alerts"
            sub="Warn before risky combinations"
            value={toggles.safetyAlerts}
            onChange={setToggle('safetyAlerts')}
          />
          <ToggleRow
            icon="phone-portrait-outline"
            title="Haptic feedback"
            sub="Subtle taps on selections"
            value={toggles.haptics}
            onChange={setToggle('haptics')}
          />
          <ToggleRow
            icon="resize-outline"
            title="Metric units"
            sub={toggles.metric ? 'Grams & milliliters' : 'Cups & tablespoons'}
            value={toggles.metric}
            onChange={setToggle('metric')}
            isLast
          />
        </Section>

        <Section title="Support">
          <Row
            icon="help-circle-outline"
            title="Help center"
            onPress={() => router.push('/help-center')}
          />
          <Row
            icon="mail-outline"
            title="Contact us"
            sub="hello@purecraftliving.com"
            onPress={() => {
              void Linking.openURL('mailto:hello@purecraftliving.com?subject=PureCraft Support');
            }}
          />
          <Row icon="star-outline" title="Rate PureCraft" onPress={() => {}} isLast />
        </Section>

        <Section title="Legal">
          <Row
            icon="lock-closed-outline"
            title="Privacy Policy"
            sub="How we protect your data"
            onPress={() => router.push('/privacy')}
          />
          <Row
            icon="document-text-outline"
            title="Terms of Use"
            sub="Rules for using PureCraft"
            onPress={() => router.push('/terms')}
          />
          <Row
            icon="shield-checkmark-outline"
            title="Data & Permissions"
            sub="Camera, notifications, pantry access"
            onPress={() => router.push('/permissions')}
          />
          <Row
            icon="trash-outline"
            title="Delete Account"
            sub="Remove your account and saved data"
            onPress={() => {
              warning();
              router.push('/delete-account');
            }}
            danger
            isLast
          />
        </Section>

        {user ? (
          <Pressable
            style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]}
            onPress={async () => {
              warning();
              await signOut();
              setOnboardingComplete(false);
              router.replace('/');
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.light.danger} />
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        ) : null}

        <Text style={styles.version}>PureCraft · {APP_VERSION}</Text>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  title,
  sub,
  onPress,
  isLast,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub?: string;
  onPress?: () => void;
  isLast?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isLast && { borderBottomWidth: 0 },
        pressed && { backgroundColor: Colors.light.surfaceAlt },
      ]}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons
          name={icon}
          size={18}
          color={danger ? Colors.light.danger : Colors.light.sageDeep}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: Colors.light.danger }]}>{title}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.light.textSubtle} />
    </Pressable>
  );
}

function ToggleRow({
  icon,
  title,
  sub,
  value,
  onChange,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={Colors.light.sageDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.light.surfaceAlt, true: Colors.light.sage }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={Colors.light.surfaceAlt}
      />
    </View>
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
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...Type.title, color: '#FFFFFF' },
  profileName: { ...Type.bodyStrong, color: Colors.light.text },
  profileMeta: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editBtnText: { ...Type.caption, color: Colors.light.text, fontWeight: '600' },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.cream,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
    ...Shadow.card,
  },
  planLeft: { flex: 1 },
  planBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
  },
  planBadgeText: { ...Type.micro, color: Colors.light.sageDeep },
  planTitle: { ...Type.bodyStrong, color: Colors.light.text, marginTop: Spacing.sm },
  planSub: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  section: { marginTop: Spacing.xxl },
  sectionTitle: {
    ...Type.caption,
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: {
    backgroundColor: '#FBEFEC',
  },
  rowTitle: { ...Type.bodyStrong, color: Colors.light.text },
  rowSub: { ...Type.caption, color: Colors.light.textMuted, marginTop: 2 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: '#FBEFEC',
    borderWidth: 1,
    borderColor: '#F1D9D2',
  },
  logoutText: { ...Type.bodyStrong, color: Colors.light.danger },
  version: {
    ...Type.caption,
    color: Colors.light.textSubtle,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});

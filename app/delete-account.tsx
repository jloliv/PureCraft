import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Type } from '@/constants/theme';

const REMOVAL_LIST = [
  { icon: 'bookmark-outline', label: 'Saved recipes', count: '24 items' },
  { icon: 'restaurant-outline', label: 'Pantry items', count: '7 ingredients' },
  { icon: 'options-outline', label: 'Preferences & profiles', count: 'Allergies, household' },
  { icon: 'card-outline', label: 'Subscription & billing history', count: 'PureCraft+ cancels at term' },
] as const;

export default function DeleteAccount() {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText.trim().toLowerCase() === 'delete';

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
        <Text style={styles.topTitle}>Delete Account</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroIcon}>
          <Ionicons name="trash-outline" size={26} color={Colors.light.danger} />
        </View>

        <Text style={styles.title}>Delete your{`\n`}PureCraft account?</Text>
        <Text style={styles.intro}>
          This permanently removes everything below. There’s no undo, and we don’t keep a backup we
          could restore from.
        </Text>

        <View style={styles.removalCard}>
          <Text style={styles.removalEyebrow}>This removes</Text>
          {REMOVAL_LIST.map((r, i) => (
            <View key={r.label} style={[styles.removalRow, i === 0 && { borderTopWidth: 0 }]}>
              <View style={styles.removalIcon}>
                <Ionicons name={r.icon} size={16} color={Colors.light.sageDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.removalLabel}>{r.label}</Text>
                <Text style={styles.removalCount}>{r.count}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.confirmCard}>
          <Text style={styles.confirmEyebrow}>Confirm</Text>
          <Text style={styles.confirmTitle}>
            Type <Text style={styles.confirmHighlight}>delete</Text> below to enable the button.
          </Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="delete"
            placeholderTextColor={Colors.light.textSubtle}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.confirmInput}
          />
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!canDelete) return;
            router.replace('/');
          }}
          disabled={!canDelete}
          style={({ pressed }) => [
            styles.deleteBtn,
            !canDelete && styles.deleteBtnDisabled,
            pressed && canDelete && { opacity: 0.92 },
          ]}
        >
          <Ionicons
            name="trash-outline"
            size={16}
            color={canDelete ? '#FFFFFF' : '#FFFFFFB3'}
          />
          <Text
            style={[styles.deleteBtnText, !canDelete && { color: '#FFFFFFB3' }]}
          >
            Delete Account
          </Text>
        </Pressable>
      </View>
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
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },

  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
    backgroundColor: '#FBEFEC',
    borderWidth: 1,
    borderColor: '#F1D9D2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.7,
    marginTop: 18,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textMuted,
    marginTop: 12,
  },

  removalCard: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
  },
  removalEyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },
  removalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  removalIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  removalCount: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },

  confirmCard: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.light.cream,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
    padding: 18,
    gap: 8,
  },
  confirmEyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: '#A98A4D',
    textTransform: 'uppercase',
  },
  confirmTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    fontWeight: '500',
  },
  confirmHighlight: {
    fontWeight: '800',
    color: Colors.light.danger,
  },
  confirmInput: {
    marginTop: 8,
    height: 48,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  cancelBtn: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 0.3,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: Colors.light.danger,
    shadowColor: Colors.light.danger,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  deleteBtnDisabled: {
    backgroundColor: '#D9B5AC',
    shadowOpacity: 0,
    elevation: 0,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

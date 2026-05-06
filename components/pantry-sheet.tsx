// Pantry action sheet — opened from the "Manage My Pantry" tile on Home.
//
// Why a single entry point:
//   The pantry has three distinct touch points (use-what-I-have, add
//   manually, scan a label) that previously fanned out across the home
//   screen as separate links / tiles / sub-actions. Consolidating them
//   into one card + sheet keeps Home tidy and gives users a single
//   mental model for "anything pantry."
//
// Visual language matches components/store-action.tsx — backdrop slide,
// rounded top, sage-soft icon badges. Side note: each row dismisses the
// sheet BEFORE navigating, so a back-swipe from the destination screen
// returns to a clean Home (not Home + open sheet).

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Action = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  /** Path the user is sent to after the sheet dismisses. */
  route: '/pantry-results' | '/pantry' | '/scan';
};

const ACTIONS: Action[] = [
  {
    icon: 'sparkles-outline',
    label: 'Use ingredients I have',
    sub: 'Recipes you can mix from your current pantry',
    route: '/pantry-results',
  },
  {
    icon: 'add-circle-outline',
    label: 'Add ingredient manually',
    sub: 'Search and tap to add a single item',
    route: '/pantry',
  },
  {
    icon: 'scan-outline',
    label: 'Scan ingredients',
    sub: 'Point your camera at a label or barcode',
    route: '/scan',
  },
];

export function PantrySheet({ visible, onClose }: Props) {
  const go = (route: Action['route']) => {
    tapLight();
    onClose();
    router.push(route);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close pantry actions"
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Manage My Pantry</Text>
        <Text style={styles.caption}>
          Add, scan, or use what you already have.
        </Text>

        <View style={styles.actions}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.route}
              onPress={() => go(a.route)}
              style={({ pressed }) => [
                styles.row,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={a.icon} size={18} color={Colors.light.sageDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{a.label}</Text>
                <Text style={styles.rowSub}>{a.sub}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.light.textMuted}
              />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.cancel,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 36, 33, 0.32)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
    marginBottom: Spacing.lg,
  },
  title: { ...Type.sectionTitle, color: Colors.light.text, marginBottom: 4 },
  caption: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginBottom: Spacing.lg,
  },
  actions: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { ...Type.bodyStrong, color: Colors.light.text },
  rowSub: {
    ...Type.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  cancel: {
    marginTop: Spacing.lg,
    height: 50,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...Type.bodyStrong, color: Colors.light.text },
});

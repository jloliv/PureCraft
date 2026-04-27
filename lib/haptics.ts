import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// PureCraft haptics — subtle, intentional, calm-luxury. Web is a no-op.
// Each helper is its own export so the call site reads as the *kind* of moment
// (selection / success / warning), not the raw API.

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

function safe(fn: () => Promise<unknown> | unknown) {
  if (!isNative) return;
  try {
    void fn();
  } catch {
    // expo-haptics throws on unsupported devices — silent.
  }
}

// Light tap — bottom-nav switches, toggles, gentle selection.
export const tapLight = () => safe(() => Haptics.selectionAsync());

// Medium press — opening modals (Make Hub), elegant CTAs.
export const tapMedium = () =>
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));

// Soft tap — Make Hub card selection, premium CTA, hero pulse.
export const tapSoft = () =>
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

// Success — recipe saved, ingredient added to pantry, milestone reached.
export const success = () =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

// Warning — destructive confirmations (delete account / remove pantry item).
export const warning = () =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));

// Celebration — recipe completed, savings milestone. Double-pulse.
export const celebrate = () =>
  safe(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(
      () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
      90,
    );
  });

// Shared toolbar for screen headers.
//
// Why this exists: every screen used to roll its own row with
// (back-chevron, centered title, empty bubble for layout balance).
// The empty bubble is visible — it has a background, border, and
// fixed dimensions — so a screen with no real top-right action ended
// up showing a "ghost" tappable-looking circle that did nothing.
// That's the anti-pattern this component fixes.
//
// API:
//   trailing — only renders when explicitly provided. NEVER a
//     placeholder. Screens that don't need a top-right action simply
//     don't pass it; the title stays visually centered because the
//     leading + trailing slots are absolutely positioned, not
//     flex-distributed.
//   leading — defaults to a back chevron that calls router.back().
//     Pass null/false to suppress (e.g. modal-style sheets where
//     the user dismisses by gesture, not a button). Pass a custom
//     ReactNode for things like a close X.
//   title — centered text. Required for the common case; pass an
//     empty string for image-only headers.
//
// Layout uses absolute positioning for the side slots so the title
// is always horizontally centered regardless of whether trailing
// renders. flex/space-between would shift the title left when the
// trailing slot is missing — we explicitly avoid that.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Type } from '@/constants/theme';

type Props = {
  /** Centered title. Optional — when omitted (or empty) the title
   *  slot renders nothing, useful when an in-content headline (eg
   *  the eyebrow + h1 on /collection) already serves as the primary
   *  page title and a duplicate in the toolbar would feel redundant. */
  title?: string;
  /** Custom leading element. Defaults to a back chevron. Pass null
   *  to suppress entirely (no leading slot rendered). */
  leading?: ReactNode | null;
  /** Right-side action. ONLY renders when provided. */
  trailing?: ReactNode;
  /** Optional padding override for screens that need a different
   *  top-bar height (defaults match the inline pattern used across
   *  the app). */
  paddingTop?: number;
  paddingBottom?: number;
};

export function TopBar({
  title,
  leading,
  trailing,
  paddingTop = Spacing.sm,
  paddingBottom = Spacing.lg,
}: Props) {
  // Default leading: a back chevron. Explicit `null` suppresses; any
  // ReactNode replaces (close X, custom button, etc.).
  const leadingNode =
    leading === null
      ? null
      : leading !== undefined
        ? leading
        : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={Colors.light.text}
              />
            </Pressable>
          );

  return (
    <View style={[styles.bar, { paddingTop, paddingBottom }]}>
      {leadingNode ? (
        <View style={styles.leadingSlot}>{leadingNode}</View>
      ) : null}
      {/* Title renders only when a non-empty string is passed. Same
          "no ghost UI" rule as the trailing slot.
          pointerEvents="none" is essential — the title's bounding box
          spans the full bar width (textAlign:center + horizontal
          padding), so without it the Text silently swallows taps that
          should hit the absolute-positioned back button on its left.
          That bug made the back chevron feel completely dead. */}
      {title ? (
        <Text style={styles.title} numberOfLines={1} pointerEvents="none">
          {title}
        </Text>
      ) : null}
      {/* Trailing renders ONLY when provided. No placeholder bubble. */}
      {trailing ? (
        <View style={styles.trailingSlot}>{trailing}</View>
      ) : null}
    </View>
  );
}

// Re-export the iconBtn style so consumers can stamp custom trailing
// actions that match the back button visually.
export const TOP_BAR_ICON_BUTTON_STYLE = {
  width: 38,
  height: 38,
  borderRadius: Radius.pill,
  backgroundColor: Colors.light.surface,
  borderWidth: 1,
  borderColor: Colors.light.border,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const styles = StyleSheet.create({
  bar: {
    height: 38 + Spacing.sm + Spacing.lg, // hit-target height + paddings
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    position: 'relative',
  },
  leadingSlot: {
    position: 'absolute',
    left: Spacing.xl,
    top: Spacing.sm,
  },
  trailingSlot: {
    position: 'absolute',
    right: Spacing.xl,
    top: Spacing.sm,
  },
  // Title sits on its own layer with horizontal padding equal to a
  // button's worth on each side, so the text never overlaps the
  // absolute-positioned slots even when the title is long.
  title: {
    ...Type.bodyStrong,
    color: Colors.light.text,
    textAlign: 'center',
    paddingHorizontal: 38 + Spacing.md,
  },
  iconBtn: TOP_BAR_ICON_BUTTON_STYLE,
});

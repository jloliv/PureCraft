// Stain Guide layout — overrides the global slide-from-right animation
// (set in app/_layout.tsx) with a faster push so the three stain-guide
// steps feel snappy. The default ~350ms slide blocks touches while the
// transition runs, which made the back chevron on /stain-guide/result
// feel "delayed for a beat" — taps were dropped until the slide
// finished. simple_push at 180ms is short enough that the user can
// tap immediately on screen entry without losing the visual sense of
// page change.
//
// gestureEnabled is intentionally OFF here. iOS's swipe-back gesture
// handler listens to the leftmost ~20px of the screen, which overlaps
// with the back chevron's hit area on every stain-guide screen
// (Spacing.xl puts the button at x=24, so the gesture zone eats half
// the button's touches). The chevron is already the primary back
// affordance — losing the gesture is a fair trade for a back button
// that always responds on first tap.
//
// Scoped intentionally to /stain-guide/* — the rest of the app keeps
// the polished slide-from-right and the swipe-back gesture.

import { Stack } from 'expo-router';

import { BACKGROUND_PRIMARY } from '@/constants/theme';

export default function StainGuideLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BACKGROUND_PRIMARY },
        animation: 'simple_push',
        animationDuration: 180,
        gestureEnabled: false,
      }}
    />
  );
}

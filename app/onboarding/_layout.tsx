import { Stack } from 'expo-router';

import { BACKGROUND_PRIMARY } from '@/constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BACKGROUND_PRIMARY },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    />
  );
}

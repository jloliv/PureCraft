import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: Colors.light.background,
        card: Colors.light.background,
        text: Colors.light.text,
        primary: Colors.light.sage,
        border: Colors.light.border,
      },
    }),
    [],
  );

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.light.background },
          animation: 'slide_from_right',
        }}
      />
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

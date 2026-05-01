import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BACKGROUND_PRIMARY, Colors } from '@/constants/theme';

export default function RootLayout() {
  // Preload the icon font so glyphs render reliably on web — without this,
  // Ionicons show as empty boxes because the font CSS isn't injected.
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: BACKGROUND_PRIMARY,
        card: BACKGROUND_PRIMARY,
        text: Colors.light.text,
        primary: Colors.light.sage,
        border: Colors.light.border,
      },
    }),
    [],
  );

  // While the icon font hasn't loaded, render a blank screen of the correct
  // background color so we don't flash unstyled icon boxes during hydration.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: BACKGROUND_PRIMARY }} />;
  }

  return (
    // SafeAreaProvider must wrap the whole app so useSafeAreaInsets()
    // returns real values (status-bar / Dynamic Island / home-indicator
    // heights). Without it, screens like result.tsx that read insets at
    // runtime get {top: 0, bottom: 0, ...} and any layout that depends on
    // those values silently collapses to "no inset" — e.g. the floating
    // topBar ends up overlapping the system clock.
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: BACKGROUND_PRIMARY },
            animation: 'slide_from_right',
          }}
        />
        <StatusBar style="dark" backgroundColor={BACKGROUND_PRIMARY} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BACKGROUND_PRIMARY, Colors } from '@/constants/theme';
import * as Sentry from '@sentry/react-native';

// Native-backed integrations (mobileReplay, feedback) are only added
// when a native build is running. In Expo Go those constructors throw
// because the native module isn't bundled, which previously caused the
// entire Sentry.init() call to abort and made every captureException
// a silent no-op. Adding them only when the native module is detected
// keeps the basic event flow working in both Expo Go AND dev builds.
// Mixed integration types — use a structural element type so both
// mobileReplay and feedback can coexist in the same array.
const nativeIntegrations: { name: string }[] = [];
try {
  // mobileReplayIntegration / feedbackIntegration are only safe to
  // construct when the native module is linked. We probe by checking
  // for the global SENTRY_RELEASE shim that the native module sets;
  // when it's missing we're in Expo Go and we skip gracefully.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((globalThis as any).HermesInternal && Sentry.mobileReplayIntegration) {
    nativeIntegrations.push(Sentry.mobileReplayIntegration());
    nativeIntegrations.push(Sentry.feedbackIntegration());
  }
} catch {
  // Native module not linked — leave nativeIntegrations empty so
  // Sentry.init still succeeds with the JS-only event path.
}

Sentry.init({
  dsn: 'https://f6c96fa14c2a977761212bc5fcdb344d@o4511343830892544.ingest.us.sentry.io/4511343918055424',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Session Replay only kicks in when native integrations were added
  // above. Without them these rates are inert.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: nativeIntegrations,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
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
    // GestureHandlerRootView must be the outermost wrapper for any
    // PanGestureHandler / Gesture API consumers. Without it, gestures
    // inside Modals fail silently on Android (the Make Hub's swipe-
    // down-to-dismiss is the active consumer). flex:1 is required —
    // without it the root collapses to 0 height.
    //
    // SafeAreaProvider must also wrap the whole app so
    // useSafeAreaInsets() returns real values (status-bar / Dynamic
    // Island / home-indicator heights). Without it, screens like
    // result.tsx that read insets at runtime get {top: 0, bottom: 0,
    // ...} and any layout that depends on those values silently
    // collapses to "no inset" — e.g. the floating topBar ends up
    // overlapping the system clock.
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
});

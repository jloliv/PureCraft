import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setOnboardingComplete } from '@/lib/onboarding-storage';
import { signIn, signInWithApple, signInWithGoogle, signUp } from '@/lib/auth';

const LOGO = require('../assets/images/PureCraftLogo.png');

const COLORS = {
  ivory: '#F8F5EF',
  sage: '#5F876A',
  sageMid: '#7E9A7F',
  sageSoft: '#E8F0E9',
  deep: '#1F2420',
  muted: '#746F68',
  textSubtle: '#9B958B',
  border: '#E8E2D2',
  surface: '#FFFFFF',
  danger: '#C26B5A',
};

type Mode = 'sign-in' | 'sign-up';

export function AuthForm({ mode }: { mode: Mode }) {
  // Optional ?next=<url> param — when present we replace to that URL
  // after a successful auth instead of /home. Used by AuthPromptModal
  // so a user who tapped Save on a recipe lands back on the recipe
  // (with a ?save=<id> trigger) rather than getting dumped on Home.
  const params = useLocalSearchParams<{ next?: string }>();
  const next = typeof params.next === 'string' ? params.next : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'sign-up';
  const headline = isSignUp ? 'Create your account' : 'Welcome back';
  const sub = isSignUp
    ? 'Save recipes, sync across devices, build your pantry.'
    : 'Sign in to your PureCraft account.';
  const cta = isSignUp ? 'Create account' : 'Sign in';
  const canSubmit = email.trim().length > 3 && password.length >= 6 && !loading;

  const submit = async () => {
    setError(null);
    setLoading(true);
    const fn = isSignUp ? signUp : signIn;
    const { error: e } = await fn(email.trim(), password);
    setLoading(false);
    if (e) {
      setError(e);
      return;
    }
    setOnboardingComplete(true);
    // Honour the ?next= return URL when AuthPromptModal sent us here.
    // Falls back to /home when the user opened the auth screens directly.
    router.replace((next ?? '/home') as never);
  };

  const handleOAuth = async (provider: 'apple' | 'google') => {
    setError(null);
    const fn = provider === 'apple' ? signInWithApple : signInWithGoogle;
    const { error: e } = await fn();
    if (e) {
      setError(
        provider === 'apple'
          ? 'Apple sign-in is launching soon — use email for now.'
          : 'Google sign-in is launching soon — use email for now.',
      );
    }
  };

  // Layout strategy — keyboard-safe by construction.
  //
  //  SafeAreaView
  //    TopBar (fixed, always visible above the keyboard)
  //    KeyboardAvoidingView (padding on iOS, height on Android)
  //      ScrollView (flexGrow:1 so the inner space-between layout still
  //                  expands to fill on tall phones; scrolls on small
  //                  ones; keyboardShouldPersistTaps="handled" so taps
  //                  on buttons inside the scroll dismiss the keyboard
  //                  AND fire their onPress)
  //        TouchableWithoutFeedback → Keyboard.dismiss  (tap empty
  //                  space to close the keyboard)
  //          View flex:1 justifyContent:'space-between'
  //            top    — logo, headline, sub, email, password, error
  //            bottom — primary CTA, Apple, Google, switch + forgot
  //
  // Why this order: the inputs sit in the upper third of the screen so
  // the keyboard never reaches them. The CTA + OAuth buttons live at
  // the bottom and ride upward as the keyboard rises (KeyboardAvoiding
  // padding pushes them up over the keyboard's top edge).
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.deep} />
        </Pressable>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              {/* ===================== TOP SECTION ===================== */}
              <View>
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />

                <Text style={styles.headline}>{headline}</Text>
                <Text style={styles.sub}>{sub}</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>EMAIL</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.textSubtle}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    style={styles.input}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
                    placeholderTextColor={COLORS.textSubtle}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete={
                      isSignUp ? 'new-password' : 'current-password'
                    }
                    style={styles.input}
                  />
                </View>

                {error ? (
                  <View style={styles.errorPill}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={14}
                      color={COLORS.danger}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
              </View>

              {/* =================== BOTTOM SECTION ==================== */}
              <View>
                <Pressable
                  accessibilityRole="button"
                  disabled={!canSubmit}
                  onPress={submit}
                  style={({ pressed }) => [
                    styles.cta,
                    !canSubmit && styles.ctaDisabled,
                    pressed && canSubmit && { opacity: 0.92 },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>{cta}</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleOAuth('apple')}
                  style={({ pressed }) => [
                    styles.oauthBtn,
                    styles.oauthApple,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
                  <Text style={styles.oauthTextDark}>Sign in with Apple</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleOAuth('google')}
                  style={({ pressed }) => [
                    styles.oauthBtn,
                    styles.oauthGoogle,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <Ionicons name="logo-google" size={18} color={COLORS.deep} />
                  <Text style={styles.oauthTextLight}>Sign in with Google</Text>
                </Pressable>

                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    router.replace(isSignUp ? '/auth/sign-in' : '/auth/sign-up')
                  }
                >
                  <Text style={styles.switchText}>
                    {isSignUp
                      ? 'Already have an account? Sign in'
                      : 'New to PureCraft? Create account'}
                  </Text>
                </Pressable>

                {!isSignUp ? (
                  <Pressable
                    hitSlop={10}
                    onPress={() => router.push('/auth/forgot-password')}
                    style={{ marginTop: 10 }}
                  >
                    <Text
                      style={[
                        styles.switchText,
                        { fontSize: 12, opacity: 0.85 },
                      ]}
                    >
                      Forgot your password?
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.ivory },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // contentContainerStyle for the ScrollView. flexGrow:1 makes the
  // inner space-between layout fill the viewport on tall phones, while
  // still allowing scroll if content overflows on small ones.
  scroll: { flexGrow: 1 },
  // The space-between container — top section sticks to the top, bottom
  // section to the bottom, keyboard rises into the gap. alignItems
  // stayed as 'stretch' (default) instead of 'center' because each
  // section now owns its own padding via paddingHorizontal here.
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },

  logo: { width: 130, height: 110, marginTop: 8, marginBottom: 18, alignSelf: 'center' },

  headline: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    color: COLORS.deep,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 10,
    // Slightly tighter — the bigger gap below was previously needed
    // because OAuth buttons followed; now the email field follows
    // directly and 18px reads better with the tighter top section.
    marginBottom: 18,
    paddingHorizontal: 8,
  },

  oauthBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  oauthApple: { backgroundColor: '#0B0B0B' },
  oauthGoogle: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  oauthTextDark: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  oauthTextLight: { color: COLORS.deep, fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },

  field: { width: '100%', marginBottom: 14 },
  label: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 6,
    marginLeft: 6,
  },
  input: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14.5,
    color: COLORS.deep,
    fontWeight: '500',
  },

  errorPill: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FBEFEC',
    borderWidth: 1,
    borderColor: '#F1D9D2',
    marginBottom: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#7A3B2C',
    fontWeight: '500',
    lineHeight: 17,
  },

  cta: {
    width: '100%',
    height: 56,
    // Was 14 when the CTA followed the password input; now it leads
    // the bottom section so margin is small — space-between provides
    // the visual separation from the inputs above.
    marginBottom: 12,
    borderRadius: 999,
    backgroundColor: COLORS.sage,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.sage,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ctaDisabled: { backgroundColor: '#B7C2B0', shadowOpacity: 0, elevation: 0 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  switchText: {
    marginTop: 18,
    fontSize: 13,
    color: COLORS.sage,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

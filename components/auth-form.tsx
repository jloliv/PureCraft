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
import {
  resendVerification,
  signIn,
  signInWithApple,
  signInWithGoogle,
  signUp,
} from '@/lib/auth';

const LOGO = require('../assets/images/PureCraftLogo.png');

const COLORS = {
  ivory: '#F8F5EF',
  sage: '#5F876A',
  sageMid: '#7E9A7F',
  sageSoft: '#E8F0E9',
  sagePale: '#EFF5EF',
  deep: '#1F2420',
  muted: '#746F68',
  textSubtle: '#9B958B',
  border: '#E8E2D2',
  borderSoft: '#EFE9DA',
  surface: '#FFFFFF',
  danger: '#C26B5A',
};

type Mode = 'sign-in' | 'sign-up';
// 'verify' is reached only after a successful sign-up when Supabase has
// "Confirm email" enabled — the user is in auth.users but has no session
// until they click the link.
type Panel = 'options' | 'email' | 'verify';

export function AuthForm({ mode }: { mode: Mode }) {
  // Optional ?next=<url> param — when present we replace to that URL
  // after a successful auth instead of /home. Used by AuthPromptModal
  // so a user who tapped Save on a recipe lands back on the recipe.
  const params = useLocalSearchParams<{ next?: string }>();
  const next = typeof params.next === 'string' ? params.next : null;

  const [panel, setPanel] = useState<Panel>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The address we sent the verification link to. Held in state so the
  // verify panel can show "we sent it to <x>" even if the user clears the
  // form after switching panels.
  const [verifyEmail, setVerifyEmail] = useState<string>('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>(
    'idle',
  );

  const isSignUp = mode === 'sign-up';
  const headline = isSignUp ? 'Create your account' : 'Welcome back';
  const sub = isSignUp
    ? 'Save your pantry, recipes, allergies, and routines across devices.'
    : 'Sign in to keep your pantry, recipes, and routines in sync.';
  const cta = isSignUp ? 'Create account' : 'Sign in';

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordLooksValid = isSignUp ? password.length >= 6 : password.length > 0;
  const canSubmit = emailLooksValid && passwordLooksValid && !loading;

  // Helper text under the CTA explaining what's missing — only kicks in
  // once the user has typed something, so the form doesn't nag on first
  // paint.
  const validationHint = (() => {
    if (loading) return null;
    if (!email && !password) return null;
    if (!emailLooksValid) return 'Enter a valid email address.';
    if (isSignUp && !passwordLooksValid)
      return 'Password must be at least 6 characters.';
    if (!passwordLooksValid) return 'Enter your password to continue.';
    return null;
  })();

  const submit = async () => {
    setError(null);
    setLoading(true);
    const trimmed = email.trim();

    if (isSignUp) {
      const result = await signUp(trimmed, password);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.needsEmailConfirmation) {
        // Auth row exists but no session yet — switch into the verify
        // panel so the user knows to check their inbox. We DON'T mark
        // onboarding complete here; the user isn't really signed in.
        setVerifyEmail(trimmed);
        setResendState('idle');
        setPanel('verify');
        Keyboard.dismiss();
        return;
      }
      // Confirm email is off in dashboard — session was issued immediately.
      setOnboardingComplete(true);
      router.replace((next ?? '/home') as never);
      return;
    }

    const { error: e } = await signIn(trimmed, password);
    setLoading(false);
    if (e) {
      setError(e);
      return;
    }
    setOnboardingComplete(true);
    router.replace((next ?? '/home') as never);
  };

  const handleResend = async () => {
    if (!verifyEmail || resendState === 'sending') return;
    setResendState('sending');
    setError(null);
    const { error: e } = await resendVerification(verifyEmail);
    if (e) {
      setError(e);
      setResendState('idle');
      return;
    }
    setResendState('sent');
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

  // Guest path — let the user experience value before account-creation
  // friction. Marks onboarding complete so the splash gate routes home
  // on next launch, then drops them on Home.
  const handleGuest = () => {
    setOnboardingComplete(true);
    router.replace('/home');
  };

  const handleBack = () => {
    if (panel === 'email' || panel === 'verify') {
      setError(null);
      setResendState('idle');
      setPanel(panel === 'verify' ? 'email' : 'options');
      Keyboard.dismiss();
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          onPress={handleBack}
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
              {/* ===================== HERO ===================== */}
              <View style={styles.hero}>
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />
                <Text style={styles.headline}>{headline}</Text>
                <Text style={styles.sub}>{sub}</Text>
              </View>

              {panel === 'options' ? (
                /* =============== PRIMARY OPTIONS =============== */
                <View style={styles.optionsBlock}>
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
                    <Text style={styles.oauthTextLight}>
                      Sign in with Google
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={handleGuest}
                    style={({ pressed }) => [
                      styles.oauthBtn,
                      styles.guestBtn,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={COLORS.deep}
                    />
                    <Text style={styles.guestBtnText}>Continue as Guest</Text>
                  </Pressable>

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

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Use email instead"
                    hitSlop={10}
                    onPress={() => {
                      setError(null);
                      setPanel('email');
                    }}
                    style={styles.emailLinkWrap}
                  >
                    <Text style={styles.emailLink}>Use email instead</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() =>
                      router.replace(
                        isSignUp ? '/auth/sign-in' : '/auth/sign-up',
                      )
                    }
                    style={{ marginTop: 4 }}
                  >
                    <Text style={styles.switchText}>
                      {isSignUp
                        ? 'Already have an account? Sign in'
                        : 'New to PureCraft? Create account'}
                    </Text>
                  </Pressable>
                </View>
              ) : panel === 'email' ? (
                /* ================== EMAIL PANEL ================== */
                <View style={styles.emailBlock}>
                  <View style={styles.field}>
                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.textSubtle}
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      style={[
                        styles.input,
                        focused === 'email' && styles.inputFocused,
                      ]}
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>PASSWORD</Text>
                    <View
                      style={[
                        styles.inputWrap,
                        focused === 'password' && styles.inputFocused,
                      ]}
                    >
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused(null)}
                        placeholder={
                          isSignUp
                            ? 'Create a password (6+ characters)'
                            : 'Enter your password'
                        }
                        placeholderTextColor={COLORS.textSubtle}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete={
                          isSignUp ? 'new-password' : 'current-password'
                        }
                        style={styles.inputBare}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        hitSlop={6}
                        onPress={() => setShowPassword((p) => !p)}
                        style={({ pressed }) => [
                          styles.eyeBtn,
                          pressed && { opacity: 0.5 },
                        ]}
                      >
                        <Ionicons
                          name={
                            showPassword ? 'eye-off-outline' : 'eye-outline'
                          }
                          size={18}
                          color={COLORS.muted}
                        />
                      </Pressable>
                    </View>
                    {isSignUp && password.length > 0 && password.length < 6 ? (
                      <Text style={styles.fieldHint}>
                        Use at least 6 characters.
                      </Text>
                    ) : null}
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

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canSubmit }}
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
                        <Text
                          style={[
                            styles.ctaText,
                            !canSubmit && styles.ctaTextDisabled,
                          ]}
                        >
                          {cta}
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={18}
                          color={canSubmit ? '#FFFFFF' : COLORS.sage}
                          style={{ opacity: canSubmit ? 1 : 0.55 }}
                        />
                      </>
                    )}
                  </Pressable>

                  {validationHint ? (
                    <Text style={styles.validationHint}>{validationHint}</Text>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back to sign-in options"
                    hitSlop={10}
                    onPress={() => {
                      setError(null);
                      Keyboard.dismiss();
                      setPanel('options');
                    }}
                    style={styles.backToOptions}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={14}
                      color={COLORS.sage}
                    />
                    <Text style={styles.backToOptionsText}>
                      Back to sign-in options
                    </Text>
                  </Pressable>

                  {!isSignUp ? (
                    <Pressable
                      accessibilityRole="button"
                      hitSlop={10}
                      onPress={() => router.push('/auth/forgot-password')}
                      style={{ marginTop: 10 }}
                    >
                      <Text
                        style={[
                          styles.switchText,
                          { fontSize: 12.5, opacity: 0.85 },
                        ]}
                      >
                        Forgot your password?
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                /* ================== VERIFY PANEL ================== */
                <View style={styles.emailBlock}>
                  <View style={styles.verifyHero}>
                    <View style={styles.verifyIconWrap}>
                      <Ionicons
                        name="mail-outline"
                        size={26}
                        color={COLORS.sage}
                      />
                    </View>
                    <Text style={styles.verifyHeadline}>Check your inbox</Text>
                    <Text style={styles.verifySub}>
                      We sent a confirmation link to{'\n'}
                      <Text style={styles.verifyEmailText}>{verifyEmail}</Text>
                    </Text>
                    <Text style={styles.verifyHelp}>
                      Tap the link in the email to finish creating your
                      account. You can come back here once you&apos;re
                      verified.
                    </Text>
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

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: resendState !== 'idle' }}
                    disabled={resendState !== 'idle'}
                    onPress={handleResend}
                    style={({ pressed }) => [
                      styles.cta,
                      resendState !== 'idle' && styles.ctaDisabled,
                      pressed && resendState === 'idle' && { opacity: 0.92 },
                    ]}
                  >
                    {resendState === 'sending' ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.ctaText,
                            resendState !== 'idle' && styles.ctaTextDisabled,
                          ]}
                        >
                          {resendState === 'sent'
                            ? 'Email re-sent'
                            : 'Resend email'}
                        </Text>
                        <Ionicons
                          name={
                            resendState === 'sent'
                              ? 'checkmark'
                              : 'mail-outline'
                          }
                          size={18}
                          color={
                            resendState === 'idle' ? '#FFFFFF' : COLORS.sage
                          }
                          style={{
                            opacity: resendState === 'idle' ? 1 : 0.6,
                          }}
                        />
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open sign-in screen"
                    hitSlop={10}
                    onPress={() => router.replace('/auth/sign-in')}
                    style={styles.backToOptions}
                  >
                    <Text style={styles.backToOptionsText}>
                      I&apos;ve confirmed — sign in
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Use a different email"
                    hitSlop={10}
                    onPress={() => {
                      setError(null);
                      setResendState('idle');
                      setPanel('email');
                    }}
                    style={{ marginTop: 6 }}
                  >
                    <Text
                      style={[
                        styles.switchText,
                        { fontSize: 12.5, opacity: 0.85 },
                      ]}
                    >
                      Use a different email
                    </Text>
                  </Pressable>
                </View>
              )}
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
    paddingBottom: 6,
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

  scroll: { flexGrow: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },

  hero: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 22,
  },
  logo: {
    width: 84,
    height: 72,
    marginBottom: 12,
  },
  headline: {
    fontSize: 26,
    lineHeight: 32,
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
    marginTop: 8,
    paddingHorizontal: 6,
  },

  optionsBlock: { width: '100%' },

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
  guestBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  oauthTextDark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  oauthTextLight: {
    color: COLORS.deep,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  guestBtnText: {
    color: COLORS.deep,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  emailLinkWrap: {
    alignSelf: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  emailLink: {
    fontSize: 13.5,
    color: COLORS.sage,
    fontWeight: '600',
    textDecorationLine: 'underline',
    letterSpacing: 0.2,
  },

  emailBlock: { width: '100%' },

  field: { width: '100%', marginBottom: 12 },
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
  inputWrap: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputBare: {
    flex: 1,
    height: '100%',
    fontSize: 14.5,
    color: COLORS.deep,
    fontWeight: '500',
    paddingVertical: 0,
  },
  inputFocused: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.sage,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  eyeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 6,
    marginLeft: 6,
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
    marginTop: 4,
    marginBottom: 8,
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
    marginTop: 6,
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
  // Disabled state — soft sage wash with sage text instead of grey-on-grey.
  // Reads as "awaiting input" rather than "broken".
  ctaDisabled: {
    backgroundColor: COLORS.sagePale,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#D8E3D7',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ctaTextDisabled: { color: COLORS.sage, opacity: 0.65 },

  validationHint: {
    marginTop: 10,
    fontSize: 12.5,
    color: COLORS.muted,
    textAlign: 'center',
  },

  backToOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 18,
    paddingVertical: 6,
  },
  backToOptionsText: {
    fontSize: 13,
    color: COLORS.sage,
    fontWeight: '600',
  },

  switchText: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.sage,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },

  verifyHero: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  verifyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: COLORS.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  verifyHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.deep,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  verifySub: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 10,
  },
  verifyEmailText: {
    color: COLORS.deep,
    fontWeight: '700',
  },
  verifyHelp: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 6,
  },
});

// Forgot password — sends a magic-link reset email via Supabase.
// User clicks the link in email → lands on `/auth/reset-password` with a
// recovery session already established. They set a new password there.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sendPasswordReset } from '@/lib/auth';

const COLORS = {
  ivory: '#F8F5EF',
  sage: '#5F876A',
  sageSoft: '#E8F0E9',
  deep: '#1F2420',
  muted: '#746F68',
  textSubtle: '#9B958B',
  border: '#E8E2D2',
  surface: '#FFFFFF',
  danger: '#C26B5A',
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const canSubmit = email.trim().length > 3 && !loading;

  const submit = async () => {
    setError(null);
    setLoading(true);
    const { error: e } = await sendPasswordReset(email.trim());
    setLoading(false);
    if (e) {
      setError(e);
      return;
    }
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.deep} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.iconHero}>
            <Ionicons name="mail-outline" size={26} color={COLORS.sage} />
          </View>
          <Text style={styles.headline}>
            {sent ? 'Check your inbox' : 'Reset your password'}
          </Text>
          <Text style={styles.sub}>
            {sent
              ? 'We just emailed a recovery link. Tap it to set a new password.'
              : "Enter your email and we'll send you a link to reset your password."}
          </Text>

          {!sent ? (
            <>
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

              {error ? (
                <View style={styles.errorPill}>
                  <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
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
                    <Text style={styles.ctaText}>Send reset link</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => router.replace('/auth/sign-in')}
              style={({ pressed }) => [
                styles.cta,
                pressed && { opacity: 0.92 },
              ]}
            >
              <Text style={styles.ctaText}>Back to sign in</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.ivory },
  topBar: {
    flexDirection: 'row',
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
  content: { flex: 1, paddingHorizontal: 28, alignItems: 'center', paddingTop: 40 },
  iconHero: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: COLORS.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headline: {
    fontSize: 24,
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
    marginBottom: 28,
    paddingHorizontal: 8,
  },
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
  errorText: { flex: 1, fontSize: 12.5, color: '#7A3B2C', fontWeight: '500' },
  cta: {
    width: '100%',
    height: 56,
    marginTop: 14,
    borderRadius: 999,
    backgroundColor: COLORS.sage,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaDisabled: { backgroundColor: '#B7C2B0' },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});

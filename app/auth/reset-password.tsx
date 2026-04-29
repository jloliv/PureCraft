// Reset password — landing page after the user clicks the magic link.
// Supabase puts them in a recovery session; we just collect a new password
// and call updateUser.

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

import { updatePassword } from '@/lib/auth';

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

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit =
    password.length >= 6 && password === confirm && !loading;

  const submit = async () => {
    setError(null);
    setLoading(true);
    const { error: e } = await updatePassword(password);
    setLoading(false);
    if (e) {
      setError(e);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace('/home'), 800);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconHero}>
            <Ionicons
              name={done ? 'checkmark-circle' : 'lock-closed-outline'}
              size={26}
              color={COLORS.sage}
            />
          </View>
          <Text style={styles.headline}>
            {done ? 'Password updated' : 'Set a new password'}
          </Text>
          <Text style={styles.sub}>
            {done
              ? 'Signing you in…'
              : 'Pick something at least 6 characters long.'}
          </Text>

          {!done ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>NEW PASSWORD</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={COLORS.textSubtle}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>CONFIRM</Text>
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Type it again"
                  placeholderTextColor={COLORS.textSubtle}
                  secureTextEntry
                  autoCapitalize="none"
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
                    <Text style={styles.ctaText}>Update password</Text>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.ivory },
  content: { flex: 1, paddingHorizontal: 28, alignItems: 'center', paddingTop: 80 },
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

// Soft account-prompt modal shown at high-intent guest moments (e.g. when
// they hit the trial-save limit). Three sign-in options + an unobtrusive
// "Continue without saving" escape hatch — feels like a benefit, not a wall.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { signInWithApple, signInWithGoogle } from '@/lib/auth';
import { tapLight } from '@/lib/haptics';

const COLORS = {
  ivory: '#F8F5EF',
  surface: '#FFFFFF',
  deep: '#1F2420',
  muted: '#6B7280',
  border: '#E8E2D2',
  sage: '#5F876A',
  appleBlack: '#0B0B0B',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
};

export function AuthPromptModal({
  visible,
  onClose,
  title = 'Save your recipes',
  subtitle = 'Create an account to keep your recipes and access them anytime.',
}: Props) {
  const goToEmail = () => {
    tapLight();
    onClose();
    router.push('/auth/sign-up');
  };

  const handleApple = async () => {
    tapLight();
    const { error } = await signInWithApple();
    if (error) {
      // OAuth not yet wired natively — fall through to email so the user
      // still has a working path. Once Supabase OAuth is configured + a
      // dev-client is built, this branch becomes the success path.
      goToEmail();
    } else {
      onClose();
    }
  };

  const handleGoogle = async () => {
    tapLight();
    const { error } = await signInWithGoogle();
    if (error) {
      goToEmail();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Ionicons name="bookmark" size={20} color={COLORS.sage} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={handleApple}
            style={({ pressed }) => [styles.btn, styles.btnApple, pressed && { opacity: 0.92 }]}
          >
            <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
            <Text style={styles.btnTextDark}>Sign in with Apple</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleGoogle}
            style={({ pressed }) => [styles.btn, styles.btnGoogle, pressed && { opacity: 0.92 }]}
          >
            <Ionicons name="logo-google" size={18} color={COLORS.deep} />
            <Text style={styles.btnTextLight}>Sign in with Google</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={goToEmail}
            style={({ pressed }) => [styles.btn, styles.btnEmail, pressed && { opacity: 0.92 }]}
          >
            <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
            <Text style={styles.btnTextDark}>Sign in with Email</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              tapLight();
              onClose();
            }}
          >
            <Text style={styles.dismiss}>Continue without saving</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 20, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.ivory,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: 'center',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#E8F0E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.deep,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  btn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  btnApple: { backgroundColor: COLORS.appleBlack },
  btnGoogle: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnEmail: { backgroundColor: COLORS.sage },
  btnTextDark: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  btnTextLight: { color: COLORS.deep, fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  dismiss: {
    marginTop: 16,
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '500',
  },
});

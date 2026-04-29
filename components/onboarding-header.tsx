import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const PALETTE = {
  text: '#1F1F1F',
  textMuted: '#6B6B6B',
  surface: 'rgba(255,255,255,0.5)',
  surfaceWarm: 'rgba(255,255,255,0.45)',
  border: 'rgba(0,0,0,0.06)',
  sage: '#A8B8A0',
  sageDeep: '#5F876A',
};

const TOTAL_STEPS = 8;

export function OnboardingHeader({
  step,
  total = TOTAL_STEPS,
  hideBack,
  hideProgress,
}: {
  step?: number;
  total?: number;
  hideBack?: boolean;
  hideProgress?: boolean;
}) {
  const progress = step ? Math.min(1, step / total) : 0;
  return (
    <View style={styles.bar}>
      {hideBack ? (
        <View style={styles.iconBtnSpacer} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={20} color={PALETTE.text} />
        </Pressable>
      )}
      {hideProgress ? (
        <View style={{ flex: 1 }} />
      ) : (
        <>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.label}>
            {step} / {total}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 18,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSpacer: { width: 38, height: 38 },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: PALETTE.surfaceWarm,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: PALETTE.sageDeep, borderRadius: 999 },
  label: { fontSize: 11.5, color: PALETTE.textMuted, fontWeight: '600' },
});

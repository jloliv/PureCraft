import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';

type Variant = 'primary' | 'ghost' | 'soft';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  trailingIcon,
  leadingIcon,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].container,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={variantStyles[variant].label.color} />
        ) : (
          <>
            {leadingIcon ? (
              <Ionicons name={leadingIcon} size={18} color={variantStyles[variant].label.color} />
            ) : null}
            <Text style={[Type.bodyStrong, variantStyles[variant].label]}>{label}</Text>
            {trailingIcon ? (
              <Ionicons name={trailingIcon} size={18} color={variantStyles[variant].label.color} />
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
});

const variantStyles = {
  primary: {
    container: {
      backgroundColor: Colors.light.sageDeep,
      ...Shadow.card,
    } as ViewStyle,
    label: {
      color: '#FFFFFF',
    },
  },
  soft: {
    container: {
      backgroundColor: Colors.light.sageSoft,
    } as ViewStyle,
    label: {
      color: Colors.light.sageDeep,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.light.border,
    } as ViewStyle,
    label: {
      color: Colors.light.text,
    },
  },
};

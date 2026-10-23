import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'filled' | 'outline' | 'ghost' | 'danger';

export type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: AppIconName;
  size?: 'regular' | 'large' | 'small';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'filled',
  disabled = false,
  loading = false,
  icon,
  size = 'regular',
  accessibilityLabel,
  style,
}: PrimaryButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const background =
    variant === 'filled' ? theme.primary : variant === 'danger' ? theme.danger : 'transparent';
  const pressedBackground =
    variant === 'filled'
      ? theme.primaryPressed
      : variant === 'danger'
        ? theme.danger
        : theme.backgroundSelected;
  const foreground =
    variant === 'filled' ? theme.onPrimary : variant === 'danger' ? '#FFFFFF' : theme.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        {
          backgroundColor: pressed ? pressedBackground : background,
          borderColor: variant === 'outline' ? theme.primary : 'transparent',
          opacity: isDisabled ? 0.45 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        icon && <AppIcon name={icon} color={foreground} size={size === 'small' ? 16 : 20} />
      )}
      <ThemedText
        style={[styles.label, size === 'large' && styles.labelLarge, size === 'small' && styles.labelSmall, { color: foreground }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 2,
    borderRadius: Spacing.five,
  },
  small: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
  },
  regular: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
  },
  large: {
    minHeight: 60,
    paddingHorizontal: Spacing.five,
  },
  label: {
    fontSize: 16,
    fontWeight: 700,
  },
  labelLarge: {
    fontSize: 19,
  },
  labelSmall: {
    fontSize: 14,
  },
});

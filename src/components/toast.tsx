import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ToastVariant = 'info' | 'success' | 'danger';

export function Toast({ message, variant }: { message: string; variant: ToastVariant }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const accent =
    variant === 'success' ? theme.success : variant === 'danger' ? theme.danger : theme.primary;

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { bottom: insets.bottom + BottomTabInset + Spacing.four }]}>
      <Animated.View
        entering={FadeInDown.duration(180)}
        exiting={FadeOutDown.duration(180)}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <ThemedText type="smallBold">{message}</ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

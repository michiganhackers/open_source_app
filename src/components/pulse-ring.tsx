import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 120;
const PULSE_MS = 1800;

function Ring({ delay, active, color }: { delay: number; active: boolean; color: string }) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (active && !reduceMotion) {
      t.value = 0;
      t.value = withDelay(
        delay,
        withRepeat(withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) }), -1),
      );
    } else {
      cancelAnimation(t);
      t.value = 0;
    }
    return () => cancelAnimation(t);
  }, [active, delay, reduceMotion, t]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : 0.5 * (1 - t.value),
    transform: [{ scale: 1 + t.value * 0.9 }],
  }));

  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
}

export function PulseRing({ active }: { active: boolean }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ring delay={0} active={active} color={theme.primary} />
      <Ring delay={PULSE_MS / 2} active={active} color={theme.primary} />
      <View
        style={[
          styles.core,
          {
            backgroundColor: active ? theme.primary : theme.backgroundElement,
            borderColor: active && reduceMotion ? theme.primaryPressed : theme.primary,
            borderWidth: active && reduceMotion ? 6 : 2,
          },
        ]}>
        <AppIcon name="listen" size={44} color={active ? theme.onPrimary : theme.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE * 2,
    height: SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3,
  },
  core: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

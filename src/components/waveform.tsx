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
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const BAR_COUNT = 28;
const MAX_HEIGHT = 56;
// Deterministic "random" resting heights so the idle shape is stable between renders.
const RESTING = Array.from({ length: BAR_COUNT }, (_, i) => 0.25 + 0.2 * Math.abs(Math.sin(i * 1.7)));

function Bar({ index, active, color }: { index: number; active: boolean; color: string }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(RESTING[index]);

  useEffect(() => {
    if (active && !reduceMotion) {
      const peak = 0.5 + 0.5 * Math.abs(Math.sin(index * 2.3));
      scale.value = withDelay(
        (index % 7) * 70,
        withRepeat(
          withSequence(
            withTiming(peak, { duration: 260, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.15, { duration: 260, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(active ? 0.7 : RESTING[index], { duration: 200 });
    }
    return () => cancelAnimation(scale);
  }, [active, index, reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({ height: MAX_HEIGHT * scale.value }));

  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
}

export function Waveform({ active, progress }: { active: boolean; progress: number }) {
  const theme = useTheme();

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={active ? 'Broadcasting' : 'Ready to broadcast'}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
      <View style={styles.bars}>
        {RESTING.map((_, index) => (
          <Bar
            key={index}
            index={index}
            active={active}
            color={active || progress > 0 ? theme.primary : theme.backgroundSelected}
          />
        ))}
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View
          style={[styles.fill, { backgroundColor: theme.primary, width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  bars: {
    height: MAX_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bar: {
    width: 5,
    borderRadius: 3,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

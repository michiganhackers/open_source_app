import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TransmissionStatus } from '@/types/transmission';

export function StatusBadge({ status }: { status: TransmissionStatus }) {
  const theme = useTheme();
  const color = status === 'completed' ? theme.success : theme.danger;

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <ThemedText type="small" style={[styles.text, { color }]}>
        {status === 'completed' ? 'Completed' : 'Failed'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
  },
});

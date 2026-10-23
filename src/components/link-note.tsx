import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getLinkStatus } from '@/utils/payload';

/** Explains why a link-like payload has no Open action. Renders nothing otherwise. */
export function LinkNote({ payload }: { payload: string }) {
  const theme = useTheme();
  const status = getLinkStatus(payload);
  if (status !== 'insecure-http' && status !== 'blocked') return null;

  return (
    <View style={styles.row}>
      <AppIcon name="lock" size={14} color={theme.danger} />
      <ThemedText type="small" style={[styles.text, { color: theme.danger }]}>
        {status === 'insecure-http'
          ? 'Insecure link (http) - not openable'
          : 'Unsupported link type - not openable'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  text: {
    fontSize: 12,
    flexShrink: 1,
  },
});

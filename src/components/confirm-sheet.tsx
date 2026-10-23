import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ConfirmRequest = {
  title: string;
  message: string;
  reasons?: string[];
  confirmLabel: string;
};

/** Generic warning dialog: used for the sensitive-data check and re-broadcasting received content. */
export function ConfirmSheet({
  request,
  onConfirm,
  onCancel,
}: {
  request: ConfirmRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();

  return (
    <Sheet
      visible={request !== null}
      title={request?.title ?? ''}
      icon="warning"
      onClose={onCancel}
      actions={
        <>
          <PrimaryButton label="Cancel" variant="ghost" onPress={onCancel} />
          <PrimaryButton label={request?.confirmLabel ?? 'Continue'} onPress={onConfirm} />
        </>
      }>
      {request && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {request.message}
          </ThemedText>
          {request.reasons?.map((reason) => (
            <View key={reason} style={styles.reason}>
              <AppIcon name="lock" size={16} color={theme.danger} />
              <ThemedText type="small" style={{ color: theme.danger }}>
                {reason}
              </ThemedText>
            </View>
          ))}
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});

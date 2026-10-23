import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeUrlRisk, URL_RISK_LABELS, type SafeUrl } from '@/utils/payload';

export function LinkConfirmSheet({
  url,
  onOpen,
  onCancel,
}: {
  url: SafeUrl | null;
  onOpen: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const risks = url ? describeUrlRisk(url) : [];

  return (
    <Sheet
      visible={url !== null}
      title="Open this link?"
      icon="open"
      onClose={onCancel}
      actions={
        <>
          <PrimaryButton label="Cancel" variant="ghost" onPress={onCancel} />
          <PrimaryButton label="Open" icon="open" onPress={onOpen} />
        </>
      }>
      {url && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            This link came from a nearby device and can&apos;t be verified. Check the site before
            opening.
          </ThemedText>
          <View style={[styles.hostBox, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Site
            </ThemedText>
            <ThemedText style={styles.host} selectable>
              {url.hostname}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.full} selectable>
              {url.href}
            </ThemedText>
          </View>
          {risks.map((risk) => (
            <View key={risk} style={styles.risk}>
              <AppIcon name="warning" size={16} color={theme.danger} />
              <ThemedText type="small" style={[styles.riskText, { color: theme.danger }]}>
                {URL_RISK_LABELS[risk]}
              </ThemedText>
            </View>
          ))}
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hostBox: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  host: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  full: {
    fontFamily: Fonts?.mono,
  },
  risk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  riskText: {
    flexShrink: 1,
  },
});

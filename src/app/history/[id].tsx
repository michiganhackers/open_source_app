import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { LinkNote } from '@/components/link-note';
import { PrimaryButton } from '@/components/primary-button';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { usePayloadActions } from '@/hooks/use-payload-actions';
import { useRebroadcast } from '@/hooks/use-rebroadcast';
import { useTheme } from '@/hooks/use-theme';
import { useTransmission } from '@/hooks/use-transmission';
import { formatDateTime, formatDuration, formatRelativeTime } from '@/utils/format';
import { getSafeUrl } from '@/utils/payload';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function TransmissionDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item, loading, error, notFound, retry } = useTransmission(id);
  const { copy, requestOpen, linkSheet } = usePayloadActions();
  const { requestRebroadcast, confirmSheet } = useRebroadcast();

  let content: React.ReactNode;
  if (notFound) {
    content = (
      <View style={styles.centered}>
        <ThemedText type="smallBold">Not found</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          This history item doesn&apos;t exist or was removed.
        </ThemedText>
      </View>
    );
  } else if (loading) {
    content = <ActivityIndicator color={theme.primary} style={styles.centered} />;
  } else if (error || !item) {
    content = (
      <View style={styles.centered}>
        <ThemedText type="smallBold" style={{ color: theme.danger }}>
          Can&apos;t reach the mock server
        </ThemedText>
        <PrimaryButton label="Retry" onPress={retry} />
      </View>
    );
  } else {
    const isSent = item.direction === 'sent';
    const canOpen = getSafeUrl(item.payload) !== null;
    content = (
      <>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.directionIcon,
              { backgroundColor: isSent ? theme.primary : theme.backgroundSelected },
            ]}>
            <AppIcon
              name={isSent ? 'sent' : 'received'}
              size={20}
              color={isSent ? theme.onPrimary : theme.text}
            />
          </View>
          <ThemedText type="default" style={styles.title}>
            {isSent ? 'Sent' : 'Received'} {item.kind === 'url' ? 'link' : 'message'}
          </ThemedText>
          <StatusBadge status={item.status} />
        </View>

        <ThemedView
          type="backgroundElement"
          style={[styles.payloadBox, { borderColor: theme.border }]}>
          <ThemedText selectable style={styles.payload}>
            {item.payload}
          </ThemedText>
        </ThemedView>
        <LinkNote payload={item.payload} />

        <ThemedView type="backgroundElement" style={styles.details}>
          <DetailRow label="Direction" value={isSent ? 'Sent' : 'Received'} />
          <DetailRow label="Type" value={item.kind === 'url' ? 'Link' : 'Text'} />
          <DetailRow
            label="When"
            value={`${formatDateTime(item.createdAt)} (${formatRelativeTime(item.createdAt)})`}
          />
          <DetailRow label="Airtime" value={formatDuration(item.durationMs)} />
          <DetailRow label="Sender" value={isSent ? 'This device' : 'Unverified sender'} />
          {item.origin === 'received' && isSent && (
            <DetailRow label="Origin" value="Re-broadcast of received content" />
          )}
        </ThemedView>

        <View style={styles.actions}>
          <PrimaryButton
            label="Re-broadcast"
            icon="rebroadcast"
            onPress={() => requestRebroadcast(item)}
          />
          <PrimaryButton
            label="Copy"
            icon="copy"
            variant="outline"
            onPress={() => copy(item.payload)}
          />
          {canOpen && (
            <PrimaryButton
              label="Open link"
              icon="open"
              variant="outline"
              onPress={() => requestOpen(item.payload)}
            />
          )}
        </View>
      </>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
      <View style={styles.inner}>{content}</View>
      {linkSheet}
      {confirmSheet}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  centered: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  directionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 700,
  },
  payloadBox: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  payload: {
    fontSize: 20,
    lineHeight: 28,
  },
  details: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});

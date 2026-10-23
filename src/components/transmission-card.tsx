import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/app-icon';
import { LinkNote } from '@/components/link-note';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Transmission } from '@/types/transmission';
import { formatRelativeTime } from '@/utils/format';
import { getSafeUrl } from '@/utils/payload';

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: pressed ? theme.backgroundSelected : 'transparent' },
      ]}>
      <AppIcon name={icon} size={16} color={theme.primary} />
      <ThemedText type="small" style={{ color: theme.primary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export const TransmissionCard = memo(function TransmissionCard({
  item,
  onPress,
  onRebroadcast,
  onCopy,
  onOpen,
}: {
  item: Transmission;
  onPress: (item: Transmission) => void;
  onRebroadcast: (item: Transmission) => void;
  onCopy: (item: Transmission) => void;
  onOpen: (item: Transmission) => void;
}) {
  const theme = useTheme();
  const isSent = item.direction === 'sent';
  const canOpen = getSafeUrl(item.payload) !== null;

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${isSent ? 'Sent' : 'Received'} ${item.kind}, ${formatRelativeTime(item.createdAt)}. Open details`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.header}>
        <View
          style={[
            styles.directionIcon,
            { backgroundColor: isSent ? theme.primary : theme.backgroundSelected },
          ]}>
          <AppIcon
            name={isSent ? 'sent' : 'received'}
            size={16}
            color={isSent ? theme.onPrimary : theme.text}
          />
        </View>
        <ThemedText type="smallBold">{isSent ? 'Sent' : 'Received'}</ThemedText>
        {!isSent && (
          <ThemedText type="small" themeColor="textSecondary">
            · Unverified sender
          </ThemedText>
        )}
        <View style={styles.spacer} />
        <ThemedText type="small" themeColor="textSecondary">
          {formatRelativeTime(item.createdAt)}
        </ThemedText>
      </View>

      <ThemedText numberOfLines={2} style={styles.payload}>
        {item.payload}
      </ThemedText>
      <LinkNote payload={item.payload} />

      <View style={styles.footer}>
        <StatusBadge status={item.status} />
        <View style={styles.spacer} />
        <ActionButton icon="rebroadcast" label="Re-broadcast" onPress={() => onRebroadcast(item)} />
        <ActionButton icon="copy" label="Copy" onPress={() => onCopy(item)} />
        {canOpen && <ActionButton icon="open" label="Open" onPress={() => onOpen(item)} />}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  directionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  payload: {
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
});

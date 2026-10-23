import { StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { MAX_PAYLOAD_LENGTH } from '@/constants/limits';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { classifyPayload } from '@/utils/payload';

export function PayloadInput({
  value,
  onChange,
  editable = true,
}: {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
}) {
  const theme = useTheme();
  const length = value.trim().length;
  const overLimit = length > MAX_PAYLOAD_LENGTH;
  const kind = classifyPayload(value.trim());

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={editable}
        multiline
        placeholder="Type a message or paste a https:// link"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Message to broadcast"
        autoCapitalize="sentences"
        autoCorrect={false}
        // Allow a little overflow so pasted text can be trimmed instead of silently cut.
        maxLength={MAX_PAYLOAD_LENGTH + 40}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: overLimit ? theme.danger : theme.border,
            fontFamily: Fonts?.sans,
          },
        ]}
      />
      <View style={styles.metaRow}>
        <View style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small" themeColor="textSecondary">
            {length === 0 ? 'Empty' : kind === 'url' ? 'Link' : 'Text'}
          </ThemedText>
        </View>
        <ThemedText
          type="small"
          style={{ color: overLimit ? theme.danger : theme.textSecondary }}
          accessibilityLabel={`${length} of ${MAX_PAYLOAD_LENGTH} characters`}>
          {length} / {MAX_PAYLOAD_LENGTH}
        </ThemedText>
      </View>
      <View style={styles.helper}>
        <AppIcon name="warning" size={14} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.helperText}>
          Anything you broadcast can be heard by anyone nearby.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  input: {
    minHeight: 120,
    borderWidth: 2,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  helper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  helperText: {
    flexShrink: 1,
  },
});

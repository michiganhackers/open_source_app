import { useState, type ReactNode } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ThemeMode = 'system' | 'light' | 'dark';
type TransmissionSpeed = 'slow' | 'normal' | 'fast';

export default function SettingsScreen() {
  const theme = useTheme();

  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [volume, setVolume] = useState(75);
  const [speed, setSpeed] = useState<TransmissionSpeed>('normal');

  const [backendEnabled, setBackendEnabled] = useState(false);
  const [saveHistory, setSaveHistory] = useState(true);
  const [autoReceive, setAutoReceive] = useState(false);

  const resetSettings = () => {
    Alert.alert(
      'Reset settings',
      'Restore all settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setThemeMode('system');
            setVolume(75);
            setSpeed('normal');
            setBackendEnabled(false);
            setSaveHistory(true);
            setAutoReceive(false);
          },
        },
      ],
    );
  };

  const Section = ({ title }: { title: string }) => (
    <ThemedText
      type="smallBold"
      style={[styles.sectionTitle, { color: theme.primary }]}>
      {title.toUpperCase()}
    </ThemedText>
  );

  const SettingRow = ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: ReactNode;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {description && (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        )}
      </View>
      {children}
    </View>
  );

  const ChoiceButton = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.choiceButton,
        {
          backgroundColor: selected ? theme.primary : theme.background,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}>
      <ThemedText
        type="smallBold"
        style={{ color: selected ? theme.onPrimary : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );

  const switchProps = {
    trackColor: {
      false: theme.border,
      true: theme.primary,
    },
    thumbColor: theme.onPrimary,
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}>

      <View style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Customize your audio sharing experience.
        </ThemedText>
      </View>

      {/* AUDIO SETTINGS */}
      <Section title="Audio" />

      <ThemedView type="backgroundElement" style={styles.card}>
        <SettingRow
          title="Microphone permission"
          description="Required to receive audio transmissions">
          <Pressable
            onPress={() =>
              Alert.alert(
                'Microphone permissions',
                'Microphone permission management will be available when audio permissions are integrated.',
              )
            }>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              Manage
            </ThemedText>
          </Pressable>
        </SettingRow>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <View style={styles.stackedSetting}>
          <View style={styles.volumeHeader}>
            <ThemedText type="smallBold">
              Transmission volume
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {volume}%
            </ThemedText>
          </View>

          <View style={styles.volumeControls}>
            <Pressable
              onPress={() => setVolume(Math.max(0, volume - 5))}
              accessibilityLabel="Decrease volume">
              <AppIcon name="close" size={18} color={theme.textSecondary} />
            </Pressable>

            <View style={[styles.volumeTrack, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.volumeFill,
                  {
                    width: `${volume}%`,
                    backgroundColor: theme.primary,
                  },
                ]}
              />
            </View>

            <Pressable
              onPress={() => setVolume(Math.min(100, volume + 5))}
              accessibilityLabel="Increase volume">
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                +
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <View style={styles.stackedSetting}>
          <ThemedText type="smallBold">
            Transmission speed
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Choose your preferred transmission speed.
          </ThemedText>

          <View style={styles.choices}>
            {(['slow', 'normal', 'fast'] as const).map((option) => (
              <ChoiceButton
                key={option}
                label={option.charAt(0).toUpperCase() + option.slice(1)}
                selected={speed === option}
                onPress={() => setSpeed(option)}
              />
            ))}
          </View>
        </View>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <SettingRow
          title="Automatic receive mode"
          description="Automatically listen when opening the app">
          <Switch
            value={autoReceive}
            onValueChange={setAutoReceive}
            {...switchProps}
          />
        </SettingRow>
      </ThemedView>

      {/* BACKEND AND PRIVACY */}
      <Section title="Backend & Privacy" />

      <ThemedView type="backgroundElement" style={styles.card}>
        <SettingRow
          title="Use hosted backend"
          description="Connect to our hosted service">
          <Switch
            value={backendEnabled}
            onValueChange={setBackendEnabled}
            {...switchProps}
          />
        </SettingRow>

        <View style={styles.notice}>
          <ThemedText type="small" themeColor="textSecondary">
            Prototype only. No backend is currently connected.
          </ThemedText>
        </View>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <SettingRow
          title="Save transmission history"
          description="Keep a record of sent and received messages">
          <Switch
            value={saveHistory}
            onValueChange={setSaveHistory}
            {...switchProps}
          />
        </SettingRow>
      </ThemedView>

      {/* APPEARANCE */}
      <Section title="Appearance" />

      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.stackedSetting}>
          <ThemedText type="smallBold">App theme</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Choose your preferred appearance.
          </ThemedText>

          <View style={styles.choices}>
            {(['system', 'light', 'dark'] as const).map((option) => (
              <ChoiceButton
                key={option}
                label={option.charAt(0).toUpperCase() + option.slice(1)}
                selected={themeMode === option}
                onPress={() => setThemeMode(option)}
              />
            ))}
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            Theme switching will be connected to the app-wide theme system later.
          </ThemedText>
        </View>
      </ThemedView>

      {/* ABOUT */}
      <Section title="About" />

      <ThemedView type="backgroundElement" style={styles.card}>
        <SettingRow
          title="App version"
          description="Current application version">
          <ThemedText type="small" themeColor="textSecondary">
            1.0.0
          </ThemedText>
        </SettingRow>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <Pressable
          onPress={() =>
            Alert.alert(
              'About',
              'An audio-based application for sharing messages between nearby devices.',
            )
          }
          style={styles.aboutButton}>
          <ThemedText type="smallBold">About this app</ThemedText>
          <AppIcon name="open" size={16} color={theme.textSecondary} />
        </Pressable>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <Pressable
          onPress={() =>
            Alert.alert(
              'Privacy policy',
              'Privacy information will be available soon.',
            )
          }
          style={styles.aboutButton}>
          <ThemedText type="smallBold">Privacy policy</ThemedText>
          <AppIcon name="open" size={16} color={theme.textSecondary} />
        </Pressable>
      </ThemedView>

      {/* RESET */}
      <Pressable
        onPress={resetSettings}
        style={[styles.resetButton, { borderColor: theme.danger }]}>
        <ThemedText type="smallBold" style={{ color: theme.danger }}>
          Reset all settings
        </ThemedText>
      </Pressable>

      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={styles.footer}>
        Made for simple communication over sound.
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    paddingBottom: 110,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.three,
    letterSpacing: 1,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
  },
  settingInfo: {
    flex: 1,
    gap: Spacing.one,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  stackedSetting: {
    gap: Spacing.two,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  volumeTrack: {
    flex: 1,
    height: 7,
    borderRadius: 5,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 5,
  },
  choices: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  choiceButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
  notice: {
    paddingVertical: Spacing.one,
  },
  aboutButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
  },
  resetButton: {
    alignItems: 'center',
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.three,
    marginTop: Spacing.three,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
});

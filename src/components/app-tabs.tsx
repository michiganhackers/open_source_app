
import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/app-icon';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="share">Share</TabButton>
          </TabTrigger>

          <TabTrigger name="history" href="/history" asChild>
            <TabButton icon="history">History</TabButton>
          </TabTrigger>

          <TabTrigger name="settings" href={'/settings' as any} asChild>
            <TabButton icon="settings">Settings</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}


export function TabButton({
  children,
  isFocused,
  icon,
  ref: _ref,
  ...props
}: TabTriggerSlotProps & { icon: AppIconName }) {
  const colors = useTheme();
  const foreground = isFocused ? colors.onPrimary : colors.textSecondary;

  return (
    <Pressable
      {...props}
      style={({ pressed }) =>
        pressed ? styles.pressed : undefined
      }
    >
      <View
        style={[
          styles.tabButtonView,
          {
            backgroundColor: isFocused
              ? colors.primary
              : 'transparent',
          },
        ]}
      >
        <AppIcon name={icon} size={16} color={foreground} />

        <ThemedText
          type="smallBold"
          style={{ color: foreground }}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}


export function CustomTabList(props: TabListProps) {
  const colors = useTheme();

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView
        type="backgroundElement"
        style={[styles.innerContainer, { borderColor: colors.border }]}>
        <ThemedText type="smallBold" style={[styles.brandText, { color: colors.primary }]}>
          V1
        </ThemedText>

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
 tabListContainer: {
  width: '100%',
  padding: Spacing.three,
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
},
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
    fontSize: 20,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});

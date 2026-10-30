import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The web tab bar floats over the top of the screen instead of the bottom.
const WEB_TOP_OFFSET = 96;


export function useScreenPadding(withTabBar = true) {
  const insets = useSafeAreaInsets();

  return {
    paddingTop:
      Platform.OS === 'web' && withTabBar
        ? WEB_TOP_OFFSET
        : Math.max(insets.top + Spacing.four, 60),

    paddingBottom:
      insets.bottom + (withTabBar ? BottomTabInset : 0) + Spacing.five,
  };
}


/** Scrollable, centered, max-width page used by the tab screens. */
export function ScreenContainer({
  children,
  scrollProps,
}: {
  children: ReactNode;
  scrollProps?: ScrollViewProps;
}) {
  const theme = useTheme();
  const padding = useScreenPadding();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, padding]}
      keyboardShouldPersistTaps="handled"
      {...scrollProps}>
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
    paddingVertical: Spacing.four,
  },
});


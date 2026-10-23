/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A1A',
    background: '#FFFFFF',
    backgroundElement: '#FFF4EB',
    backgroundSelected: '#FFE3CC',
    textSecondary: '#6B6B6B',
    // #E06A00 keeps white bold button labels readable (WCAG large-text contrast).
    primary: '#E06A00',
    primaryPressed: '#C25B00',
    onPrimary: '#FFFFFF',
    border: '#F1D9C4',
    success: '#1F9D55',
    danger: '#D93025',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0F0F10',
    backgroundElement: '#1C1C1E',
    backgroundSelected: '#2A2A2D',
    textSecondary: '#B0B4BA',
    primary: '#FF8C1A',
    primaryPressed: '#FFA347',
    onPrimary: '#1A1A1A',
    border: '#333336',
    success: '#34C77B',
    danger: '#FF6B5E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

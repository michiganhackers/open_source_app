import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ShareDraftProvider } from '@/state/share-draft';
import { ToastProvider } from '@/state/toast';

SplashScreen.preventAutoHideAsync();

function navigationTheme(scheme: 'light' | 'dark'): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <ThemeProvider value={navigationTheme(scheme)}>
      <ShareDraftProvider>
        <ToastProvider>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerTintColor: Colors[scheme].primary }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="history/[id]" options={{ title: 'Details' }} />
          </Stack>
        </ToastProvider>
      </ShareDraftProvider>
    </ThemeProvider>
  );
}

import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

import type { SafeUrl } from '@/utils/payload';

/** Opens an already-validated https link in the sandboxed in-app browser. */
export async function openSafeUrl(url: SafeUrl): Promise<void> {
  await openBrowserAsync(url.href, {
    presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
  });
}

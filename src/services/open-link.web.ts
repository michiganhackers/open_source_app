import type { SafeUrl } from '@/utils/payload';

/**
 * expo-web-browser opens a popup without `noopener`, which would let the
 * opened page script this app through `window.opener`. Open a severed tab instead.
 */
export async function openSafeUrl(url: SafeUrl): Promise<void> {
  if (typeof window === 'undefined') return;
  window.open(url.href, '_blank', 'noopener,noreferrer');
}

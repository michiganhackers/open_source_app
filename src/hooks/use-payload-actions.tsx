import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';

import { LinkConfirmSheet } from '@/components/link-confirm-sheet';
import { openSafeUrl } from '@/services/open-link';
import { useToast } from '@/state/toast';
import { getSafeUrl, type SafeUrl } from '@/utils/payload';

/**
 * Copy and open actions shared by the Share, History, and Detail screens.
 * Render `linkSheet` once in the screen so Open always goes through confirmation.
 */
export function usePayloadActions() {
  const { showToast } = useToast();
  const [pendingUrl, setPendingUrl] = useState<SafeUrl | null>(null);

  const copy = useCallback(
    async (payload: string) => {
      try {
        const ok = await Clipboard.setStringAsync(payload);
        showToast(ok ? 'Copied' : "Couldn't copy", ok ? 'success' : 'danger');
      } catch {
        showToast("Couldn't copy", 'danger');
      }
    },
    [showToast],
  );

  const requestOpen = useCallback((payload: string) => {
    const url = getSafeUrl(payload);
    if (url) setPendingUrl(url);
  }, []);

  const confirmOpen = useCallback(async () => {
    const url = pendingUrl;
    setPendingUrl(null);
    if (!url) return;
    try {
      await openSafeUrl(url);
    } catch {
      showToast("Couldn't open link", 'danger');
    }
  }, [pendingUrl, showToast]);

  const linkSheet = (
    <LinkConfirmSheet url={pendingUrl} onOpen={confirmOpen} onCancel={() => setPendingUrl(null)} />
  );

  return { copy, requestOpen, linkSheet };
}

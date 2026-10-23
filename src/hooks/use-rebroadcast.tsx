import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { useShareDraft } from '@/state/share-draft';
import type { Transmission } from '@/types/transmission';

const RECEIVED_WARNING = {
  title: 'Re-broadcast received content?',
  message:
    "This message came from an unverified nearby device. Re-broadcasting it will share it with everyone in range. You'll still need to press Broadcast.",
  confirmLabel: 'Continue',
};

/**
 * Prefills the Share screen through in-memory state (never URL params) and
 * never starts broadcasting on its own. Render `confirmSheet` once per screen.
 */
export function useRebroadcast() {
  const router = useRouter();
  const { setDraft } = useShareDraft();
  const [pending, setPending] = useState<Transmission | null>(null);

  const prefill = useCallback(
    (item: Transmission) => {
      const fromReceived = item.direction === 'received' || item.origin === 'received';
      setDraft({ payload: item.payload, origin: fromReceived ? 'received' : 'local' });
      router.navigate('/');
    },
    [router, setDraft],
  );

  const requestRebroadcast = useCallback(
    (item: Transmission) => {
      if (item.direction === 'received' || item.origin === 'received') setPending(item);
      else prefill(item);
    },
    [prefill],
  );

  const confirmSheet = (
    <ConfirmSheet
      request={pending ? RECEIVED_WARNING : null}
      onCancel={() => setPending(null)}
      onConfirm={() => {
        const item = pending;
        setPending(null);
        if (item) prefill(item);
      }}
    />
  );

  return { requestRebroadcast, confirmSheet };
}

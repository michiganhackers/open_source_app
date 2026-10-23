import { useCallback, useEffect, useRef, useState } from 'react';

import { LISTEN_TIMEOUT_MS } from '@/constants/limits';
import { createTransmission } from '@/services/api';
import { getDeviceId, newRecordId } from '@/services/device-id';
import { estimateAirtimeMs, soundEngine } from '@/services/sound-engine';
import { useToast } from '@/state/toast';
import type { Broadcast } from '@/types/transmission';

import { useStopOnLeave } from './use-stop-on-leave';

export type ListenStatus = 'idle' | 'listening' | 'received' | 'error';

export type ReceivedMessage = Broadcast & { receivedAt: string };

export function useListen() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<ListenStatus>('idle');
  const [received, setReceived] = useState<ReceivedMessage | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(LISTEN_TIMEOUT_MS / 1000);
  const controllerRef = useRef<AbortController | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const halt = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    clearInterval(countdownRef.current);
  }, []);

  const stop = useCallback(() => {
    if (!controllerRef.current) return;
    halt();
    setStatus((current) => (current === 'listening' ? 'idle' : current));
  }, [halt]);

  useStopOnLeave(stop);
  useEffect(() => halt, [halt]);

  const start = useCallback(() => {
    halt();
    const controller = new AbortController();
    controllerRef.current = controller;
    setReceived(null);
    setStatus('listening');

    const deadline = Date.now() + LISTEN_TIMEOUT_MS;
    setSecondsLeft(LISTEN_TIMEOUT_MS / 1000);
    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        halt();
        setStatus('idle');
        showToast('Stopped listening');
      }
    }, 250);

    soundEngine.startListening(
      (broadcast) => {
        if (controller.signal.aborted) return;
        halt();
        const receivedAt = new Date().toISOString();
        setReceived({ ...broadcast, receivedAt });
        setStatus('received');
        showToast('Message received', 'success');
        createTransmission({
          id: newRecordId(),
          direction: 'received',
          payload: broadcast.payload,
          kind: broadcast.kind,
          createdAt: receivedAt,
          durationMs: estimateAirtimeMs(broadcast.payload),
          status: 'completed',
          deviceId: getDeviceId(),
          origin: 'received',
        }).catch(() => showToast("Couldn't reach the mock server", 'danger'));
      },
      () => {
        halt();
        setStatus('error');
        showToast("Couldn't reach the mock server", 'danger');
      },
      controller.signal,
    );
  }, [halt, showToast]);

  const dismiss = useCallback(() => {
    halt();
    setReceived(null);
    setStatus('idle');
  }, [halt]);

  return { status, received, secondsLeft, start, stop, dismiss };
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { createTransmission } from '@/services/api';
import { getDeviceId, newRecordId } from '@/services/device-id';
import { AbortedError, estimateAirtimeMs, soundEngine } from '@/services/sound-engine';
import { useToast } from '@/state/toast';
import type { TransmissionOrigin } from '@/types/transmission';
import { classifyPayload } from '@/utils/payload';

import { useStopOnLeave } from './use-stop-on-leave';

export type BroadcastStatus = 'idle' | 'broadcasting' | 'sent' | 'error';

const SENT_RESET_MS = 2000;

export function useBroadcast() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<BroadcastStatus>('idle');
  const [progress, setProgress] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  useStopOnLeave(stop);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const start = useCallback(
    async (payload: string, origin: TransmissionOrigin) => {
      stop();
      clearTimeout(resetTimer.current);
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus('broadcasting');
      setProgress(0);

      const record = {
        id: newRecordId(),
        direction: 'sent' as const,
        payload,
        kind: classifyPayload(payload),
        deviceId: getDeviceId(),
        origin,
      };

      try {
        const { durationMs } = await soundEngine.broadcast(payload, setProgress, controller.signal);
        setStatus('sent');
        showToast('Broadcast sent', 'success');
        resetTimer.current = setTimeout(() => setStatus('idle'), SENT_RESET_MS);
        createTransmission({
          ...record,
          createdAt: new Date().toISOString(),
          durationMs,
          status: 'completed',
        }).catch(() => showToast("Couldn't reach the mock server", 'danger'));
      } catch (error) {
        if (error instanceof AbortedError || controller.signal.aborted) {
          setStatus('idle');
          setProgress(0);
          return;
        }
        setStatus('error');
        showToast('Broadcast failed', 'danger');
        createTransmission({
          ...record,
          createdAt: new Date().toISOString(),
          durationMs: estimateAirtimeMs(payload),
          status: 'failed',
        }).catch(() => {});
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [showToast, stop],
  );

  const reset = useCallback(() => {
    clearTimeout(resetTimer.current);
    setStatus('idle');
    setProgress(0);
  }, []);

  return { status, progress, start, stop, reset };
}

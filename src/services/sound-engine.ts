import {
  BROADCAST_MIN_MS,
  BROADCAST_MS_PER_CHAR,
  BROADCAST_PROGRESS_TICK_MS,
  LISTEN_POLL_INTERVAL_MS,
  RECEIVE_RATE_LIMIT,
} from '@/constants/limits';
import { createBroadcast, listBroadcasts } from '@/services/api';
import { getDeviceId, newRecordId } from '@/services/device-id';
import type { Broadcast } from '@/types/transmission';
import { classifyPayload } from '@/utils/payload';

export class AbortedError extends Error {
  constructor() {
    super('Aborted');
    this.name = 'AbortedError';
  }
}

export type BroadcastResult = { durationMs: number };

export interface SoundEngine {
  /** Plays `payload` as sound. Rejects with `AbortedError` if `signal` aborts first. */
  broadcast(
    payload: string,
    onProgress: (progress: number) => void,
    signal: AbortSignal,
  ): Promise<BroadcastResult>;
  /** Calls `onReceive` for each decoded message until `signal` aborts. */
  startListening(
    onReceive: (broadcast: Broadcast) => void,
    onError: (error: unknown) => void,
    signal: AbortSignal,
  ): void;
}

export function estimateAirtimeMs(payload: string): number {
  return Math.max(BROADCAST_MIN_MS, payload.length * BROADCAST_MS_PER_CHAR);
}

/**
 * Fakes the audio channel with json-server: a finished broadcast is POSTed to
 * `/broadcasts`, and listeners poll for entries from other device ids.
 */
class MockSoundEngine implements SoundEngine {
  async broadcast(
    payload: string,
    onProgress: (progress: number) => void,
    signal: AbortSignal,
  ): Promise<BroadcastResult> {
    const durationMs = estimateAirtimeMs(payload);

    await new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(new AbortedError());
      const startedAt = Date.now();
      const interval = setInterval(() => {
        const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
        onProgress(progress);
        if (progress >= 1) {
          cleanup();
          resolve();
        }
      }, BROADCAST_PROGRESS_TICK_MS);
      const onAbort = () => {
        cleanup();
        reject(new AbortedError());
      };
      const cleanup = () => {
        clearInterval(interval);
        signal.removeEventListener('abort', onAbort);
      };
      signal.addEventListener('abort', onAbort);
    });

    // Only a fully played broadcast reaches the "air", so stopping early sends nothing.
    await createBroadcast(
      {
        id: newRecordId(),
        payload,
        kind: classifyPayload(payload),
        createdAt: new Date().toISOString(),
        deviceId: getDeviceId(),
      },
      signal,
    );
    return { durationMs };
  }

  startListening(
    onReceive: (broadcast: Broadcast) => void,
    onError: (error: unknown) => void,
    signal: AbortSignal,
  ): void {
    // Small lookback so a broadcast finishing right as listening starts isn't missed.
    const since = new Date(Date.now() - 1000).toISOString();
    const seen = new Set<string>();
    const deliveredAt: number[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    const withinRateLimit = () => {
      const now = Date.now();
      while (deliveredAt.length && now - deliveredAt[0] > RECEIVE_RATE_LIMIT.windowMs) {
        deliveredAt.shift();
      }
      return deliveredAt.length < RECEIVE_RATE_LIMIT.max;
    };

    const poll = async () => {
      try {
        const broadcasts = await listBroadcasts({
          since,
          excludeDeviceId: getDeviceId(),
          signal,
        });
        for (const broadcast of broadcasts) {
          if (signal.aborted) return;
          if (seen.has(broadcast.id)) continue;
          seen.add(broadcast.id);
          if (!withinRateLimit()) continue;
          deliveredAt.push(Date.now());
          onReceive(broadcast);
        }
      } catch (error) {
        if (signal.aborted) return;
        onError(error);
        return;
      }
      if (!signal.aborted) timer = setTimeout(poll, LISTEN_POLL_INTERVAL_MS);
    };

    signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
    poll();
  }
}

export const soundEngine: SoundEngine = new MockSoundEngine();

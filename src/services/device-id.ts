import { randomUUID } from 'expo-crypto';

let deviceId: string | null = null;

/**
 * Random id generated lazily once per app load and never persisted, so it
 * can't track users and two browser tabs behave as two separate devices.
 */
export function getDeviceId(): string {
  if (!deviceId) deviceId = randomUUID();
  return deviceId;
}

export function newRecordId(): string {
  return randomUUID();
}

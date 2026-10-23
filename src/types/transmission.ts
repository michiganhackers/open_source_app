export type TransmissionKind = 'text' | 'url';
export type TransmissionDirection = 'sent' | 'received';
export type TransmissionStatus = 'completed' | 'failed';
export type TransmissionOrigin = 'local' | 'received';

export type Transmission = {
  id: string;
  direction: TransmissionDirection;
  payload: string;
  kind: TransmissionKind;
  /** ISO 8601 */
  createdAt: string;
  durationMs: number;
  status: TransmissionStatus;
  /** Random per-load id, never a hardware id. */
  deviceId: string;
  origin?: TransmissionOrigin;
};

export type Broadcast = {
  id: string;
  payload: string;
  kind: TransmissionKind;
  createdAt: string;
  deviceId: string;
};

export type HistoryFilter = 'all' | TransmissionDirection;

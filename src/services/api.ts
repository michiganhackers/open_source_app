import { API_TIMEOUT_MS, HISTORY_PAGE_SIZE } from '@/constants/limits';
import type { Broadcast, HistoryFilter, Transmission } from '@/types/transmission';
import { classifyPayload, sanitizePayload } from '@/utils/payload';

const FALLBACK_BASE_URL = 'http://localhost:3001';

function getBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (!configured && __DEV__) {
    console.warn(`EXPO_PUBLIC_API_URL is not set; using ${FALLBACK_BASE_URL}`);
  }
  return (configured || FALLBACK_BASE_URL).replace(/\/+$/, '');
}

const BASE_URL = getBaseUrl();

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid' | 'aborted';

export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && ID_PATTERN.test(id);
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const { method = 'GET', body, query, signal } = options;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.append(key, String(value));
  }
  const qs = params.toString();
  const url = `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;

  // AbortSignal.any isn't available everywhere, so link the caller's signal manually.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  try {
    const response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError('http', `Server responded with ${response.status}`, response.status);
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError('timeout', 'The mock server took too long to respond');
    if (signal?.aborted) throw new ApiError('aborted', 'Request cancelled');
    throw new ApiError('network', "Can't reach the mock server");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiError('invalid', 'Server returned malformed JSON');
  }
}

const isString = (v: unknown): v is string => typeof v === 'string';

function isTransmission(value: unknown): value is Transmission {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isValidId(v.id) &&
    (v.direction === 'sent' || v.direction === 'received') &&
    isString(v.payload) &&
    isString(v.createdAt) &&
    !Number.isNaN(Date.parse(v.createdAt)) &&
    typeof v.durationMs === 'number' &&
    Number.isFinite(v.durationMs) &&
    (v.status === 'completed' || v.status === 'failed') &&
    isString(v.deviceId) &&
    (v.origin === undefined || v.origin === 'local' || v.origin === 'received')
  );
}

function isBroadcast(value: unknown): value is Broadcast {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isValidId(v.id) &&
    isString(v.payload) &&
    isString(v.createdAt) &&
    !Number.isNaN(Date.parse(v.createdAt)) &&
    isString(v.deviceId)
  );
}

/** Never trust server-provided payloads or kinds: re-sanitize and re-classify. */
function normalize<T extends Transmission | Broadcast>(item: T): T {
  const payload = sanitizePayload(item.payload);
  return { ...item, payload, kind: classifyPayload(payload) };
}

function filterValid<T>(values: unknown, guard: (v: unknown) => v is T, label: string): T[] {
  if (!Array.isArray(values)) throw new ApiError('invalid', `Expected a list of ${label}`);
  const valid = values.filter(guard);
  if (__DEV__ && valid.length !== values.length) {
    console.warn(`Dropped ${values.length - valid.length} invalid ${label} from the mock server`);
  }
  return valid;
}

export type TransmissionPage = { items: Transmission[]; hasMore: boolean };

export async function listTransmissions(options: {
  filter: HistoryFilter;
  page: number;
  signal?: AbortSignal;
}): Promise<TransmissionPage> {
  const response = await request('/transmissions', {
    query: {
      _sort: 'createdAt',
      _order: 'desc',
      _page: options.page,
      _limit: HISTORY_PAGE_SIZE,
      direction: options.filter === 'all' ? undefined : options.filter,
    },
    signal: options.signal,
  });
  const raw = await readJson(response);
  const items = filterValid(raw, isTransmission, 'transmissions').map(normalize);
  const total = Number(response.headers.get('X-Total-Count'));
  const hasMore = Number.isFinite(total) && total > 0
    ? options.page * HISTORY_PAGE_SIZE < total
    : Array.isArray(raw) && raw.length === HISTORY_PAGE_SIZE;
  return { items, hasMore };
}

export async function getTransmission(id: string, signal?: AbortSignal): Promise<Transmission> {
  if (!isValidId(id)) throw new ApiError('invalid', 'Invalid id');
  const response = await request(`/transmissions/${encodeURIComponent(id)}`, { signal });
  const raw = await readJson(response);
  if (!isTransmission(raw)) throw new ApiError('invalid', 'Server returned an invalid record');
  return normalize(raw);
}

export async function createTransmission(transmission: Transmission): Promise<Transmission> {
  const response = await request('/transmissions', { method: 'POST', body: transmission });
  const raw = await readJson(response);
  if (!isTransmission(raw)) throw new ApiError('invalid', 'Server returned an invalid record');
  return normalize(raw);
}

export async function createBroadcast(broadcast: Broadcast, signal?: AbortSignal): Promise<void> {
  await request('/broadcasts', { method: 'POST', body: broadcast, signal });
}

export async function listBroadcasts(options: {
  since: string;
  excludeDeviceId: string;
  signal?: AbortSignal;
}): Promise<Broadcast[]> {
  const response = await request('/broadcasts', {
    query: {
      createdAt_gte: options.since,
      deviceId_ne: options.excludeDeviceId,
      _sort: 'createdAt',
      _order: 'asc',
    },
    signal: options.signal,
  });
  const raw = await readJson(response);
  return filterValid(raw, isBroadcast, 'broadcasts')
    .filter((b) => b.deviceId !== options.excludeDeviceId && b.createdAt >= options.since)
    .map(normalize);
}

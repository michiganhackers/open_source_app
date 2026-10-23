import { MAX_PAYLOAD_LENGTH } from '@/constants/limits';
import type { TransmissionKind } from '@/types/transmission';

// C0 controls except \n, DEL, and C1 controls.
const CONTROL_CHARS = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g;
// Bidi embeddings/overrides/isolates and directional marks, which can visually disguise text.
const BIDI_CHARS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
// Zero-width and invisible joiners/spaces.
const ZERO_WIDTH_CHARS = /[\u180E\u200B-\u200D\u2060\uFEFF]/g;

export function sanitizePayload(raw: string): string {
  return raw
    .replace(CONTROL_CHARS, '')
    .replace(BIDI_CHARS, '')
    .replace(ZERO_WIDTH_CHARS, '')
    .trim()
    .slice(0, MAX_PAYLOAD_LENGTH);
}

const HTTP_URL = /^https?:\/\/\S+$/i;

export function classifyPayload(clean: string): TransmissionKind {
  return HTTP_URL.test(clean) ? 'url' : 'text';
}

export type SafeUrl = {
  href: string;
  hostname: string;
};

/**
 * Strict https-only parser. React Native's URL polyfill doesn't implement
 * `hostname`/`protocol`, so parsing is done here instead of with `URL`.
 * Rejects credentials (`user@host`), whitespace, and every non-https scheme,
 * which also blocks this app's own `apptesting://` deep links.
 */
const HTTPS_URL = /^https:\/\/([^\s/?#@:\\]+)(?::(\d{1,5}))?(?:[/?#][^\s\\]*)?$/i;

export function getSafeUrl(clean: string): SafeUrl | null {
  const match = HTTPS_URL.exec(clean);
  if (!match) return null;
  const hostname = match[1].toLowerCase();
  if (!hostname.includes('.') || hostname.startsWith('.') || hostname.endsWith('.')) return null;
  return { href: clean, hostname };
}

export type LinkStatus = 'none' | 'safe' | 'insecure-http' | 'blocked';

export function getLinkStatus(clean: string): LinkStatus {
  if (getSafeUrl(clean)) return 'safe';
  if (/^http:\/\//i.test(clean)) return 'insecure-http';
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean) && !/\s/.test(clean)) return 'blocked';
  return 'none';
}

export type UrlRisk = 'punycode' | 'non-ascii' | 'ip-host' | 'long-subdomain';

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

export function describeUrlRisk(url: SafeUrl): UrlRisk[] {
  const risks: UrlRisk[] = [];
  const labels = url.hostname.split('.');
  if (labels.some((label) => label.startsWith('xn--'))) risks.push('punycode');
  if (/[^\x00-\x7F]/.test(url.hostname)) risks.push('non-ascii');
  if (IPV4.test(url.hostname)) risks.push('ip-host');
  if (labels.length > 4 || url.hostname.length > 50) risks.push('long-subdomain');
  return risks;
}

export const URL_RISK_LABELS: Record<UrlRisk, string> = {
  punycode: 'Domain uses punycode (xn--) and may imitate another site',
  'non-ascii': 'Domain contains non-English characters that may imitate another site',
  'ip-host': 'Link points to a raw IP address instead of a domain',
  'long-subdomain': 'Unusually long domain, often used to hide the real site',
};

const CHECKS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\b(password|passwd|pwd|passcode|otp|pin|secret|api[_-]?key|token)\b/i,
    reason: 'Mentions a password, PIN, or secret',
  },
  { pattern: /(^|\D)\d{6,8}(\D|$)/, reason: 'Looks like a one-time code' },
  { pattern: /\b(?:\d[ -]?){13,19}\b/, reason: 'Looks like a card number' },
  {
    pattern: /\b(sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[abprs]-[A-Za-z0-9-]+)/,
    reason: 'Looks like an API key',
  },
];

const LONG_TOKEN = /[A-Za-z0-9_\-+/=]{24,}/g;

function hasHighEntropyToken(text: string): boolean {
  const withoutUrls = text.replace(/https?:\/\/\S+/gi, '');
  return (withoutUrls.match(LONG_TOKEN) ?? []).some(
    (token) => /[A-Za-z]/.test(token) && /\d/.test(token),
  );
}

/** Returns human-readable reasons the payload may contain something private. */
export function findSensitiveReasons(text: string): string[] {
  const reasons = CHECKS.filter(({ pattern }) => pattern.test(text)).map(({ reason }) => reason);
  if (hasHighEntropyToken(text)) reasons.push('Contains a long random-looking token');
  return reasons;
}

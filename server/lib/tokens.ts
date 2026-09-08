import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Rotating QR tokens, TOTP-style.
 *
 * The token is not stored anywhere. It is derived from the session's secret and
 * the current time window, so the server can recompute and compare it without
 * keeping mutable state — which removes the race between "teacher's page rotates
 * the QR" and "a student submits the token they just scanned".
 *
 * A token is accepted for its own window plus `GRACE_WINDOWS` previous ones, so
 * with the default 10s rotation a screenshot is worthless after about 20s.
 */

export const DEFAULT_ROTATION_SECONDS = 10;
const GRACE_WINDOWS = 1;
const TOKEN_LENGTH = 16;

export function createSessionSecret(): string {
  return randomBytes(32).toString('hex');
}

export function windowFor(rotationSeconds: number, nowMs: number): number {
  return Math.floor(nowMs / 1000 / rotationSeconds);
}

/** Milliseconds until the given window ends. */
export function windowExpiresAt(rotationSeconds: number, window: number): number {
  return (window + 1) * rotationSeconds * 1000;
}

export function makeToken(secret: string, sessionId: string, window: number): string {
  return createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(`${sessionId}.${window}`)
    .digest('base64url')
    .slice(0, TOKEN_LENGTH);
}

export function currentToken(
  secret: string,
  sessionId: string,
  rotationSeconds: number,
  nowMs: number = Date.now(),
): { token: string; expiresAt: number } {
  const window = windowFor(rotationSeconds, nowMs);
  return {
    token: makeToken(secret, sessionId, window),
    expiresAt: windowExpiresAt(rotationSeconds, window),
  };
}

export function verifyToken(
  secret: string,
  sessionId: string,
  rotationSeconds: number,
  candidate: string,
  nowMs: number = Date.now(),
): boolean {
  if (typeof candidate !== 'string' || candidate.length !== TOKEN_LENGTH) return false;
  const window = windowFor(rotationSeconds, nowMs);
  let ok = false;
  // No early return: every candidate costs the same number of comparisons.
  for (let i = 0; i <= GRACE_WINDOWS; i++) {
    if (constantTimeEquals(candidate, makeToken(secret, sessionId, window - i))) ok = true;
  }
  return ok;
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * A scan pass.
 *
 * The QR token is deliberately short-lived — it proves the holder was looking at
 * the projected code seconds ago. But a student needs longer than that to type
 * their number, so the token is exchanged once, on page load, for a pass.
 *
 * The pass is bound to the session and the device, and carries its own expiry,
 * so forwarding it to a friend is useless: their device hash will not match.
 * Like the token, it is derived rather than stored.
 */

export const PASS_TTL_MS = 5 * 60 * 1000;

export function issuePass(
  serverSecret: string,
  sessionId: string,
  deviceHash: string,
  now: number = Date.now(),
  ttlMs: number = PASS_TTL_MS,
): { pass: string; expiresAt: number } {
  const expiresAt = now + ttlMs;
  return { pass: `${expiresAt}.${sign(serverSecret, sessionId, deviceHash, expiresAt)}`, expiresAt };
}

export function verifyPass(
  serverSecret: string,
  sessionId: string,
  deviceHash: string,
  pass: string,
  now: number = Date.now(),
): boolean {
  if (typeof pass !== 'string') return false;
  const dot = pass.indexOf('.');
  if (dot <= 0) return false;

  const expiresAt = Number(pass.slice(0, dot));
  if (!Number.isSafeInteger(expiresAt) || now >= expiresAt) return false;

  const provided = Buffer.from(pass.slice(dot + 1), 'utf8');
  const expected = Buffer.from(sign(serverSecret, sessionId, deviceHash, expiresAt), 'utf8');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function sign(serverSecret: string, sessionId: string, deviceHash: string, expiresAt: number) {
  return createHmac('sha256', serverSecret)
    .update(`${sessionId}.${deviceHash}.${expiresAt}`)
    .digest('base64url');
}

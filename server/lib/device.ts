import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

/**
 * Device identity.
 *
 * The browser holds a random UUID in a signed, httpOnly cookie. The server only
 * ever stores its SHA-256, so the database never contains a value that could be
 * replayed into a cookie if the file leaked.
 */

export const DEVICE_COOKIE = 'aid';
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function newDeviceId(): string {
  return randomUUID();
}

export function signDeviceId(deviceId: string, serverSecret: string): string {
  const mac = createHmac('sha256', serverSecret).update(deviceId).digest('base64url');
  return `${deviceId}.${mac}`;
}

/** Returns the device id if the signature checks out, otherwise null. */
export function unsignDeviceId(value: string | undefined, serverSecret: string): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const deviceId = value.slice(0, dot);
  const provided = value.slice(dot + 1);
  const expected = createHmac('sha256', serverSecret).update(deviceId).digest('base64url');
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return deviceId;
}

export function hashDeviceId(deviceId: string): string {
  return createHash('sha256').update(deviceId).digest('hex');
}

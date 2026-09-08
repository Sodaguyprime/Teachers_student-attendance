import { Hono, type Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '../db/client.js';
import { classes, sessions } from '../db/schema.js';
import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_MAX_AGE,
  hashDeviceId,
  newDeviceId,
  signDeviceId,
  unsignDeviceId,
} from '../lib/device.js';
import { events } from '../lib/events.js';
import { RateLimiter } from '../lib/rate-limit.js';
import { issuePass } from '../lib/pass.js';
import { verifyToken } from '../lib/tokens.js';
import { recordScan } from '../services/attendance.js';

const submitLimiter = new RateLimiter(10, 60_000);
setInterval(() => submitLimiter.sweep(), 60_000).unref();

const submitSchema = z.object({
  pass: z.string().min(1).max(256),
  studentNumber: z.string().trim().min(1).max(32),
  lastName: z.string().trim().min(1).max(80),
});

export function scanRoutes(db: Db, serverSecret: string) {
  const app = new Hono();

  /**
   * Opens the scan page: sets the device cookie, and exchanges the short-lived
   * QR token for a pass that lasts long enough to fill the form in.
   *
   * Deliberately says nothing about the roster.
   */
  app.get('/:sessionId', (c) => {
    const deviceId = ensureDevice(c, serverSecret);
    const sessionId = c.req.param('sessionId');

    const session = db
      .select({
        id: sessions.id,
        secret: sessions.secret,
        rotationSeconds: sessions.rotationSeconds,
        closedAt: sessions.closedAt,
        className: classes.name,
      })
      .from(sessions)
      .innerJoin(classes, eq(classes.id, sessions.classId))
      .where(eq(sessions.id, sessionId))
      .get();

    if (!session) return c.json({ error: 'SESSION_NOT_FOUND' }, 404);

    const open = session.closedAt === null;
    const token = c.req.query('t') ?? '';
    const tokenValid =
      open && verifyToken(session.secret, session.id, session.rotationSeconds, token);

    if (!tokenValid) {
      return c.json({ className: session.className, open, tokenValid: false, pass: null });
    }

    const { pass, expiresAt } = issuePass(serverSecret, session.id, hashDeviceId(deviceId));
    return c.json({
      className: session.className,
      open,
      tokenValid: true,
      pass,
      passExpiresAt: expiresAt,
    });
  });

  app.post('/:sessionId', zValidator('json', submitSchema), (c) => {
    const deviceId = ensureDevice(c, serverSecret);
    const deviceHash = hashDeviceId(deviceId);

    if (!submitLimiter.check(deviceHash)) {
      return c.json({ ok: false, code: 'RATE_LIMITED' }, 429);
    }

    const body = c.req.valid('json');
    const result = recordScan(db, {
      sessionId: c.req.param('sessionId'),
      pass: body.pass,
      studentNumber: body.studentNumber,
      lastName: body.lastName,
      deviceHash,
      serverSecret,
    });

    if (result.ok) events.publish(c.req.param('sessionId'), 'attendance', {});
    return c.json(result, result.ok ? 200 : 403);
  });

  return app;
}

function ensureDevice(c: Context, serverSecret: string): string {
  const existing = unsignDeviceId(getCookie(c, DEVICE_COOKIE), serverSecret);
  if (existing) return existing;

  const deviceId = newDeviceId();
  setCookie(c, DEVICE_COOKIE, signDeviceId(deviceId, serverSecret), {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
  return deviceId;
}

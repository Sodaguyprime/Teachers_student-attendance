import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '../db/client.js';
import { attendance, classes, deviceClaims, sessions } from '../db/schema.js';
import { events } from '../lib/events.js';
import { localNetworkAddress } from '../lib/net.js';
import { createSessionSecret, currentToken, DEFAULT_ROTATION_SECONDS } from '../lib/tokens.js';
import { getRoster, getSessionState, listClasses, toCsv } from '../services/queries.js';
import { parseRoster, replaceRoster } from '../services/roster.js';

export function teacherRoutes(db: Db, port: number) {
  const app = new Hono();

  app.get('/classes', (c) => c.json(listClasses(db)));

  app.post(
    '/classes',
    zValidator('json', z.object({ name: z.string().trim().min(1).max(120) })),
    (c) => {
      const { name } = c.req.valid('json');
      const row = { id: randomUUID(), name, createdAt: Date.now() };
      db.insert(classes).values(row).run();
      return c.json(row, 201);
    },
  );

  app.delete('/classes/:id', (c) => {
    db.delete(classes).where(eq(classes.id, c.req.param('id'))).run();
    return c.body(null, 204);
  });

  app.get('/classes/:id/roster', (c) => c.json(getRoster(db, c.req.param('id'))));

  app.post(
    '/classes/:id/roster',
    zValidator('json', z.object({ text: z.string().max(200_000) })),
    (c) => {
      const classId = c.req.param('id');
      if (!db.select().from(classes).where(eq(classes.id, classId)).get()) {
        return c.json({ error: 'Class not found' }, 404);
      }
      const parsed = parseRoster(c.req.valid('json').text);
      const imported = replaceRoster(db, classId, parsed.students);
      return c.json({ imported, skipped: parsed.skipped });
    },
  );

  /** Frees a student's phone binding — lost device, new phone, wrong first scan. */
  app.post('/classes/:id/roster/:studentId/release-device', (c) => {
    db.delete(deviceClaims)
      .where(
        and(
          eq(deviceClaims.classId, c.req.param('id')),
          eq(deviceClaims.studentId, c.req.param('studentId')),
        ),
      )
      .run();
    return c.body(null, 204);
  });

  app.post(
    '/classes/:id/sessions',
    zValidator(
      'json',
      z.object({ rotationSeconds: z.number().int().min(5).max(120).optional() }).optional(),
    ),
    (c) => {
      const classId = c.req.param('id');
      if (!db.select().from(classes).where(eq(classes.id, classId)).get()) {
        return c.json({ error: 'Class not found' }, 404);
      }
      const row = {
        id: randomUUID(),
        classId,
        secret: createSessionSecret(),
        rotationSeconds: c.req.valid('json')?.rotationSeconds ?? DEFAULT_ROTATION_SECONDS,
        openedAt: Date.now(),
        closedAt: null,
        headcount: null,
      };
      db.insert(sessions).values(row).run();
      return c.json({ id: row.id }, 201);
    },
  );

  app.get('/sessions/:id', (c) => {
    const state = getSessionState(db, c.req.param('id'));
    return state ? c.json(state) : c.json({ error: 'Session not found' }, 404);
  });

  /**
   * The QR payload. The session secret never leaves the server, so the teacher's
   * page asks for the current token and refreshes when it expires.
   */
  app.get('/sessions/:id/token', (c) => {
    const session = db.select().from(sessions).where(eq(sessions.id, c.req.param('id'))).get();
    if (!session) return c.json({ error: 'Session not found' }, 404);
    if (session.closedAt !== null) return c.json({ error: 'Session closed' }, 409);

    const { token, expiresAt } = currentToken(session.secret, session.id, session.rotationSeconds);
    const host = `${localNetworkAddress()}:${port}`;
    return c.json({
      url: `http://${host}/s/${session.id}?t=${token}`,
      token,
      expiresAt,
    });
  });

  app.post('/sessions/:id/close', (c) => {
    db.update(sessions)
      .set({ closedAt: Date.now() })
      .where(eq(sessions.id, c.req.param('id')))
      .run();
    events.publish(c.req.param('id'), 'closed', {});
    return c.body(null, 204);
  });

  /** The headcount check: bodies in the room versus rows in the database. */
  app.post(
    '/sessions/:id/headcount',
    zValidator('json', z.object({ count: z.number().int().min(0).max(2000).nullable() })),
    (c) => {
      db.update(sessions)
        .set({ headcount: c.req.valid('json').count })
        .where(eq(sessions.id, c.req.param('id')))
        .run();
      return c.body(null, 204);
    },
  );

  app.post(
    '/sessions/:id/mark',
    zValidator('json', z.object({ studentId: z.string().min(1) })),
    (c) => {
      const sessionId = c.req.param('id');
      const { studentId } = c.req.valid('json');
      const existing = db
        .select()
        .from(attendance)
        .where(and(eq(attendance.sessionId, sessionId), eq(attendance.studentId, studentId)))
        .get();
      if (existing) return c.json({ error: 'Already marked' }, 409);

      db.insert(attendance)
        .values({
          id: randomUUID(),
          sessionId,
          studentId,
          deviceHash: null,
          method: 'manual',
          markedAt: Date.now(),
        })
        .run();
      events.publish(sessionId, 'attendance', {});
      return c.body(null, 204);
    },
  );

  app.delete('/sessions/:id/mark/:studentId', (c) => {
    db.delete(attendance)
      .where(
        and(
          eq(attendance.sessionId, c.req.param('id')),
          eq(attendance.studentId, c.req.param('studentId')),
        ),
      )
      .run();
    events.publish(c.req.param('id'), 'attendance', {});
    return c.body(null, 204);
  });

  app.get('/sessions/:id/export.csv', (c) => {
    const state = getSessionState(db, c.req.param('id'));
    if (!state) return c.json({ error: 'Session not found' }, 404);
    const date = new Date(state.openedAt).toISOString().slice(0, 10);
    const filename = `attendance-${state.className.replace(/[^\w-]+/g, '-')}-${date}.csv`;
    return new Response(`\uFEFF${toCsv(state)}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  });

  /** Live feed so students appear the instant they scan. */
  app.get('/sessions/:id/events', (c) => {
    const sessionId = c.req.param('id');
    return streamSSE(c, async (stream) => {
      let open = true;
      const unsubscribe = events.subscribe(sessionId, (event, data) => {
        void stream.writeSSE({ event, data: JSON.stringify(data) });
      });
      stream.onAbort(() => {
        open = false;
        unsubscribe();
      });
      await stream.writeSSE({ event: 'ready', data: '{}' });
      // Keeps proxies and idle timeouts from dropping the connection.
      while (open) {
        await stream.sleep(20_000);
        if (open) await stream.writeSSE({ event: 'ping', data: '{}' });
      }
    });
  });

  return app;
}


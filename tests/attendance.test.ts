import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { applySchema, createDb, type Db } from '../server/db/client.js';
import { attendance, classes, deviceClaims, sessions, students } from '../server/db/schema.js';
import { createSessionSecret } from '../server/lib/tokens.js';
import { issuePass } from '../server/lib/pass.js';
import { hashDeviceId } from '../server/lib/device.js';
import { recordScan } from '../server/services/attendance.js';
import {
  countDeviceClaims,
  releaseAllDevices,
  releaseDevice,
} from '../server/services/devices.js';

const NOW = 1_700_000_000_000;
const ROTATION = 10;

let db: Db;
let secret: string;
const CLASS_ID = 'class-1';
const SESSION_ID = 'session-1';

const SERVER_SECRET = 'test-server-secret-value-at-least-32-chars';

function pass(deviceHash = hashDeviceId('phone-a'), sessionId = SESSION_ID, now = NOW) {
  return issuePass(SERVER_SECRET, sessionId, deviceHash, now).pass;
}

function scan(overrides: Partial<Parameters<typeof recordScan>[1]> = {}) {
  return recordScan(db, {
    sessionId: SESSION_ID,
    pass: pass(),
    studentNumber: '22109046',
    lastName: 'Mirghani',
    deviceHash: hashDeviceId('phone-a'),
    serverSecret: SERVER_SECRET,
    now: NOW,
    ...overrides,
  });
}

function openSession(): string {
  const id = `session-${Math.random().toString(36).slice(2)}`;
  db.insert(sessions)
    .values({
      id,
      classId: CLASS_ID,
      secret: createSessionSecret(),
      rotationSeconds: ROTATION,
      openedAt: NOW,
      closedAt: null,
      headcount: null,
    })
    .run();
  return id;
}

beforeEach(() => {
  const created = createDb(':memory:');
  applySchema(created.sqlite);
  db = created.db;
  secret = createSessionSecret();

  db.insert(classes).values({ id: CLASS_ID, name: 'CMPE 344', createdAt: NOW }).run();
  db.insert(students)
    .values([
      { id: 's1', classId: CLASS_ID, studentNumber: '22109046', firstName: 'Ammar', lastName: 'Mirghani' },
      { id: 's2', classId: CLASS_ID, studentNumber: '22110643', firstName: 'Mohammed', lastName: 'Saif' },
    ])
    .run();
  db.insert(sessions)
    .values({
      id: SESSION_ID,
      classId: CLASS_ID,
      secret,
      rotationSeconds: ROTATION,
      openedAt: NOW,
      closedAt: null,
      headcount: null,
    })
    .run();
});

describe('recordScan', () => {
  it('marks a roster student present', () => {
    const result = scan();
    expect(result).toEqual({
      ok: true,
      studentName: 'Ammar Mirghani',
      className: 'CMPE 344',
      markedAt: NOW,
    });
  });

  it('rejects an expired pass before touching the roster', () => {
    const stale = issuePass(SERVER_SECRET, SESSION_ID, hashDeviceId('phone-a'), NOW - 60 * 60_000).pass;
    expect(scan({ pass: stale })).toEqual({ ok: false, code: 'TOKEN_INVALID' });
  });

  it('rejects a pass issued to a different device, so it cannot be forwarded', () => {
    expect(scan({ pass: pass(hashDeviceId('phone-b')) })).toEqual({
      ok: false,
      code: 'TOKEN_INVALID',
    });
  });

  it('rejects a pass issued for a different session', () => {
    expect(scan({ pass: pass(hashDeviceId('phone-a'), 'other-session') })).toEqual({
      ok: false,
      code: 'TOKEN_INVALID',
    });
  });

  it('rejects a student number that is not on the roster', () => {
    expect(scan({ studentNumber: '99999999', lastName: 'Nobody' })).toEqual({
      ok: false,
      code: 'NOT_ON_ROSTER',
    });
  });

  it('rejects a roster number typed with the wrong surname', () => {
    expect(scan({ lastName: 'Wrong' })).toEqual({ ok: false, code: 'NAME_MISMATCH' });
  });

  it('rejects a second scan for the same student in the same session', () => {
    expect(scan().ok).toBe(true);
    expect(scan()).toEqual({ ok: false, code: 'ALREADY_MARKED' });
  });

  it('rejects a second student marking from a phone already used this class', () => {
    expect(scan().ok).toBe(true);
    expect(
      scan({ studentNumber: '22110643', lastName: 'Saif' }),
    ).toEqual({ ok: false, code: 'DEVICE_BOUND_TO_OTHER_STUDENT' });
  });

  it('rejects a student trying to mark from a second phone', () => {
    expect(scan().ok).toBe(true);
    expect(
      scan({ deviceHash: hashDeviceId('phone-b'), pass: pass(hashDeviceId('phone-b')) }),
    ).toEqual({ ok: false, code: 'STUDENT_BOUND_TO_OTHER_DEVICE' });
  });

  it('leaves no device claim behind when the scan is rejected', () => {
    expect(scan({ lastName: 'Wrong' }).ok).toBe(false);
    // The rejected attempt must not have burned the student's binding.
    expect(scan().ok).toBe(true);
  });

  it('does not bind a device when the scan is rejected after the roster check', () => {
    // Teacher already marked this student by hand, so the scan is refused.
    db.insert(attendance)
      .values({
        id: 'a1',
        sessionId: SESSION_ID,
        studentId: 's1',
        deviceHash: null,
        method: 'manual',
        markedAt: NOW,
      })
      .run();

    expect(scan()).toEqual({ ok: false, code: 'ALREADY_MARKED' });
    expect(db.select().from(deviceClaims).all()).toEqual([]);
  });

  it('rejects scans once the session is closed', () => {
    db.update(sessions).set({ closedAt: NOW }).run();
    expect(scan()).toEqual({ ok: false, code: 'SESSION_CLOSED' });
  });

  it('rejects an unknown session', () => {
    expect(scan({ sessionId: randomUUID() })).toEqual({ ok: false, code: 'SESSION_NOT_FOUND' });
  });

  it('lets a bound phone mark the same student in a later session of the class', () => {
    expect(scan().ok).toBe(true);

    const second = 'session-2';
    const secondSecret = createSessionSecret();
    db.insert(sessions)
      .values({
        id: second,
        classId: CLASS_ID,
        secret: secondSecret,
        rotationSeconds: ROTATION,
        openedAt: NOW,
        closedAt: null,
        headcount: null,
      })
      .run();

    const result = recordScan(db, {
      sessionId: second,
      pass: pass(hashDeviceId('phone-a'), second),
      studentNumber: '22109046',
      lastName: 'Mirghani',
      deviceHash: hashDeviceId('phone-a'),
      serverSecret: SERVER_SECRET,
      now: NOW,
    });
    expect(result.ok).toBe(true);
  });
});

describe('releasing a phone binding', () => {
  it('lets a student sign in from a new phone after the teacher releases theirs', () => {
    expect(scan().ok).toBe(true);

    // Lost phone: the replacement is refused until the binding is cleared.
    const newPhone = { deviceHash: hashDeviceId('phone-b'), pass: pass(hashDeviceId('phone-b')) };
    expect(scan(newPhone)).toEqual({ ok: false, code: 'STUDENT_BOUND_TO_OTHER_DEVICE' });

    expect(releaseDevice(db, CLASS_ID, 's1')).toBe(1);

    // The old session still has them present, so start a clean one.
    const next = openSession();
    const result = recordScan(db, {
      sessionId: next,
      pass: pass(hashDeviceId('phone-b'), next),
      studentNumber: '22109046',
      lastName: 'Mirghani',
      deviceHash: hashDeviceId('phone-b'),
      serverSecret: SERVER_SECRET,
      now: NOW,
    });
    expect(result.ok).toBe(true);
  });

  it('frees the phone for another student too', () => {
    expect(scan().ok).toBe(true);
    releaseDevice(db, CLASS_ID, 's1');

    const next = openSession();
    const result = recordScan(db, {
      sessionId: next,
      pass: pass(hashDeviceId('phone-a'), next),
      studentNumber: '22110643',
      lastName: 'Saif',
      deviceHash: hashDeviceId('phone-a'),
      serverSecret: SERVER_SECRET,
      now: NOW,
    });
    expect(result.ok).toBe(true);
  });

  it('leaves recorded attendance alone when a binding is released', () => {
    expect(scan().ok).toBe(true);
    releaseDevice(db, CLASS_ID, 's1');
    expect(db.select().from(attendance).all()).toHaveLength(1);
  });

  it('reports nothing released when the student has no phone bound', () => {
    expect(releaseDevice(db, CLASS_ID, 's2')).toBe(0);
  });

  it('clears every binding in the class at once', () => {
    expect(scan().ok).toBe(true);
    expect(scan({ studentNumber: '22110643', lastName: 'Saif', deviceHash: hashDeviceId('phone-b'), pass: pass(hashDeviceId('phone-b')) }).ok).toBe(true);
    expect(countDeviceClaims(db, CLASS_ID)).toBe(2);

    expect(releaseAllDevices(db, CLASS_ID)).toBe(2);
    expect(countDeviceClaims(db, CLASS_ID)).toBe(0);
  });
});

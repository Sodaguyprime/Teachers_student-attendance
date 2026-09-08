import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { attendance, classes, deviceClaims, sessions, students } from '../db/schema.js';
import { verifyPass } from '../lib/pass.js';
import type { ScanResult } from '../../shared/types.js';

export interface ScanInput {
  sessionId: string;
  /** Issued when the QR token was exchanged on page load. */
  pass: string;
  studentNumber: string;
  /** Confirms the scanner knows whose number they typed. Compared case-insensitively. */
  lastName: string;
  deviceHash: string;
  serverSecret: string;
  now?: number;
}

/**
 * The whole trust decision for a student scan, in one place.
 *
 * Ordering matters: the pass is checked before anything is looked up, so a
 * stale scan reveals nothing about who is on the roster.
 */
export function recordScan(db: Db, input: ScanInput): ScanResult {
  const now = input.now ?? Date.now();

  const session = db.select().from(sessions).where(eq(sessions.id, input.sessionId)).get();
  if (!session) return { ok: false, code: 'SESSION_NOT_FOUND' };
  if (session.closedAt !== null) return { ok: false, code: 'SESSION_CLOSED' };

  if (!verifyPass(input.serverSecret, session.id, input.deviceHash, input.pass, now)) {
    return { ok: false, code: 'TOKEN_INVALID' };
  }

  const student = db
    .select()
    .from(students)
    .where(
      and(
        eq(students.classId, session.classId),
        eq(students.studentNumber, normalizeNumber(input.studentNumber)),
      ),
    )
    .get();
  if (!student) return { ok: false, code: 'NOT_ON_ROSTER' };

  if (student.lastName.trim().toLowerCase() !== input.lastName.trim().toLowerCase()) {
    return { ok: false, code: 'NAME_MISMATCH' };
  }

  const cls = db.select().from(classes).where(eq(classes.id, session.classId)).get();
  const className = cls?.name ?? '';

  return db.transaction((tx): ScanResult => {
    // Every rejection is decided before anything is written, so a failed scan
    // can never leave a device binding or a partial row behind.
    const claimByStudent = tx
      .select()
      .from(deviceClaims)
      .where(
        and(eq(deviceClaims.classId, session.classId), eq(deviceClaims.studentId, student.id)),
      )
      .get();

    // A student number is bound to the first phone that used it in this class...
    if (claimByStudent && claimByStudent.deviceHash !== input.deviceHash) {
      return { ok: false, code: 'STUDENT_BOUND_TO_OTHER_DEVICE' };
    }

    const claimByDevice = tx
      .select()
      .from(deviceClaims)
      .where(
        and(
          eq(deviceClaims.classId, session.classId),
          eq(deviceClaims.deviceHash, input.deviceHash),
        ),
      )
      .get();

    // ...and that phone cannot then be used for anyone else.
    if (claimByDevice && claimByDevice.studentId !== student.id) {
      return { ok: false, code: 'DEVICE_BOUND_TO_OTHER_STUDENT' };
    }

    // The unique indexes are the real guard; these lookups only exist to turn a
    // constraint violation into a message a student can act on.
    const already = tx
      .select()
      .from(attendance)
      .where(and(eq(attendance.sessionId, session.id), eq(attendance.studentId, student.id)))
      .get();
    if (already) return { ok: false, code: 'ALREADY_MARKED' };

    const deviceUsed = tx
      .select()
      .from(attendance)
      .where(
        and(eq(attendance.sessionId, session.id), eq(attendance.deviceHash, input.deviceHash)),
      )
      .get();
    if (deviceUsed) return { ok: false, code: 'DEVICE_ALREADY_MARKED' };

    if (!claimByStudent) {
      tx.insert(deviceClaims)
        .values({
          id: randomUUID(),
          classId: session.classId,
          studentId: student.id,
          deviceHash: input.deviceHash,
          claimedAt: now,
        })
        .run();
    }

    tx.insert(attendance)
      .values({
        id: randomUUID(),
        sessionId: session.id,
        studentId: student.id,
        deviceHash: input.deviceHash,
        method: 'scan',
        markedAt: now,
      })
      .run();

    return {
      ok: true,
      studentName: `${student.firstName} ${student.lastName}`,
      className,
      markedAt: now,
    };
  });
}

export function normalizeNumber(value: string): string {
  return value.trim();
}

import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { deviceClaims } from '../db/schema.js';

/**
 * Releasing a phone binding.
 *
 * The first scan binds a student number to a phone for the whole class, which
 * is what stops one handset signing in for two people. That binding has to be
 * breakable: students lose phones, replace them, or bind the wrong number on
 * their first scan. Only the teacher can release one.
 *
 * Releasing clears the binding, not the attendance already recorded — a student
 * marked present stays present.
 */

export function releaseDevice(db: Db, classId: string, studentId: string): number {
  const result = db
    .delete(deviceClaims)
    .where(and(eq(deviceClaims.classId, classId), eq(deviceClaims.studentId, studentId)))
    .run();
  return result.changes;
}

/** Clears every binding in a class, for a new term or a reshuffled group. */
export function releaseAllDevices(db: Db, classId: string): number {
  const result = db.delete(deviceClaims).where(eq(deviceClaims.classId, classId)).run();
  return result.changes;
}

export function countDeviceClaims(db: Db, classId: string): number {
  return db.select().from(deviceClaims).where(eq(deviceClaims.classId, classId)).all().length;
}

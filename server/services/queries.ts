import { and, asc, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { attendance, classes, deviceClaims, sessions, students } from '../db/schema.js';
import type { AttendanceRow, ClassSummary, RosterEntry, SessionState } from '../../shared/types.js';

export function listClasses(db: Db): ClassSummary[] {
  return db
    .select({
      id: classes.id,
      name: classes.name,
      createdAt: classes.createdAt,
      studentCount: sql<number>`count(${students.id})`,
    })
    .from(classes)
    .leftJoin(students, eq(students.classId, classes.id))
    .groupBy(classes.id)
    .orderBy(asc(classes.name))
    .all();
}

export function getRoster(db: Db, classId: string): RosterEntry[] {
  return db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      claimId: deviceClaims.id,
    })
    .from(students)
    .leftJoin(deviceClaims, eq(deviceClaims.studentId, students.id))
    .where(eq(students.classId, classId))
    .orderBy(asc(students.studentNumber))
    .all()
    .map(({ claimId, ...rest }) => ({ ...rest, hasDeviceClaim: claimId !== null }));
}

export function getSessionState(db: Db, sessionId: string): SessionState | null {
  const session = db
    .select({
      id: sessions.id,
      classId: sessions.classId,
      className: classes.name,
      rotationSeconds: sessions.rotationSeconds,
      openedAt: sessions.openedAt,
      closedAt: sessions.closedAt,
      headcount: sessions.headcount,
    })
    .from(sessions)
    .innerJoin(classes, eq(classes.id, sessions.classId))
    .where(eq(sessions.id, sessionId))
    .get();
  if (!session) return null;

  const rows: AttendanceRow[] = db
    .select({
      studentId: students.id,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      markedAt: attendance.markedAt,
      method: attendance.method,
      claimId: deviceClaims.id,
    })
    .from(students)
    .leftJoin(
      attendance,
      and(eq(attendance.studentId, students.id), eq(attendance.sessionId, sessionId)),
    )
    .leftJoin(deviceClaims, eq(deviceClaims.studentId, students.id))
    .where(eq(students.classId, session.classId))
    .orderBy(asc(students.studentNumber))
    .all()
    .map(({ claimId, ...rest }) => ({ ...rest, hasDeviceClaim: claimId !== null }));

  return {
    ...session,
    present: rows
      .filter((r) => r.markedAt !== null)
      .sort((a, b) => (b.markedAt ?? 0) - (a.markedAt ?? 0)),
    absent: rows.filter((r) => r.markedAt === null),
  };
}

export function toCsv(state: SessionState): string {
  const header = ['Student Number', 'First Name', 'Last Name', 'Status', 'Marked At', 'Method'];
  const rows = [
    ...state.present.map((r) => [
      r.studentNumber,
      r.firstName,
      r.lastName,
      'Present',
      new Date(r.markedAt ?? 0).toISOString(),
      r.method ?? '',
    ]),
    ...state.absent.map((r) => [r.studentNumber, r.firstName, r.lastName, 'Absent', '', '']),
  ];
  return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}

/**
 * Quotes every field and strips a leading formula character, so a name like
 * `=cmd()` cannot become a live formula when the export is opened in Excel.
 */
function escapeCsv(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

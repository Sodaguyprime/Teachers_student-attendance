import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const students = sqliteTable(
  'students',
  {
    id: text('id').primaryKey(),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    studentNumber: text('student_number').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
  },
  (t) => [uniqueIndex('students_class_number_unq').on(t.classId, t.studentNumber)],
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    /** Per-session HMAC key (hex). Never leaves the server. */
    secret: text('secret').notNull(),
    rotationSeconds: integer('rotation_seconds').notNull(),
    openedAt: integer('opened_at').notNull(),
    closedAt: integer('closed_at'),
    /** Bodies the teacher actually counted in the room, for the proxy check. */
    headcount: integer('headcount'),
  },
  (t) => [index('sessions_class_idx').on(t.classId)],
);

export const attendance = sqliteTable(
  'attendance',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    /** SHA-256 of the device id. NULL for teacher-entered rows. */
    deviceHash: text('device_hash'),
    method: text('method', { enum: ['scan', 'manual'] }).notNull(),
    markedAt: integer('marked_at').notNull(),
  },
  (t) => [
    // One student can only be present once per session.
    uniqueIndex('attendance_session_student_unq').on(t.sessionId, t.studentId),
    // One phone can only mark once per session. NULLs compare distinct in
    // SQLite, so teacher-entered rows are exempt by construction.
    uniqueIndex('attendance_session_device_unq').on(t.sessionId, t.deviceHash),
  ],
);

export const deviceClaims = sqliteTable(
  'device_claims',
  {
    id: text('id').primaryKey(),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    deviceHash: text('device_hash').notNull(),
    claimedAt: integer('claimed_at').notNull(),
  },
  (t) => [
    // A student number is bound to one phone for the whole class...
    uniqueIndex('device_claims_class_student_unq').on(t.classId, t.studentId),
    // ...and that phone cannot also be some other student's.
    uniqueIndex('device_claims_class_device_unq').on(t.classId, t.deviceHash),
  ],
);

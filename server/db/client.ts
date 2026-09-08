import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema.js';

export type Db = ReturnType<typeof createDb>['db'];

export function createDb(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

/**
 * The schema is small and append-only, so it is applied directly rather than
 * through a migration runner. Every statement is IF NOT EXISTS, so this is safe
 * to run on every boot.
 */
export function applySchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      student_number TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS students_class_number_unq
      ON students (class_id, student_number);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      secret TEXT NOT NULL,
      rotation_seconds INTEGER NOT NULL,
      opened_at INTEGER NOT NULL,
      closed_at INTEGER,
      headcount INTEGER
    );
    CREATE INDEX IF NOT EXISTS sessions_class_idx ON sessions (class_id);

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      device_hash TEXT,
      method TEXT NOT NULL,
      marked_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS attendance_session_student_unq
      ON attendance (session_id, student_id);
    CREATE UNIQUE INDEX IF NOT EXISTS attendance_session_device_unq
      ON attendance (session_id, device_hash);

    CREATE TABLE IF NOT EXISTS device_claims (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      device_hash TEXT NOT NULL,
      claimed_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS device_claims_class_student_unq
      ON device_claims (class_id, student_id);
    CREATE UNIQUE INDEX IF NOT EXISTS device_claims_class_device_unq
      ON device_claims (class_id, device_hash);
  `);
}

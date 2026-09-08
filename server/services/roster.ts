import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { students } from '../db/schema.js';

export interface ParsedStudent {
  studentNumber: string;
  firstName: string;
  lastName: string;
}

export interface ParseResult {
  students: ParsedStudent[];
  /** 1-based line numbers that could not be read, for showing back to the teacher. */
  skipped: number[];
}

const HEADER = /^\s*(student\s*(number|id)|number|id)\b/i;

/**
 * Parses a pasted roster. Accepts comma, tab or semicolon separated lines of
 * `number, first name, last name`, ignores blanks and an optional header row.
 */
export function parseRoster(text: string): ParseResult {
  const out: ParsedStudent[] = [];
  const skipped: number[] = [];
  const seen = new Set<string>();

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;
    if (index === 0 && HEADER.test(line)) return;

    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
    const [studentNumber, firstName, ...rest] = parts;
    const lastName = rest.join(' ').trim();

    if (!studentNumber || !firstName || !lastName) {
      skipped.push(index + 1);
      return;
    }
    if (seen.has(studentNumber)) {
      skipped.push(index + 1);
      return;
    }

    seen.add(studentNumber);
    out.push({ studentNumber, firstName, lastName });
  });

  return { students: out, skipped };
}

/** Replaces a class roster wholesale. Attendance rows cascade-delete with removed students. */
export function replaceRoster(db: Db, classId: string, roster: ParsedStudent[]): number {
  return db.transaction((tx) => {
    tx.delete(students).where(eq(students.classId, classId)).run();
    if (roster.length === 0) return 0;
    tx.insert(students)
      .values(roster.map((s) => ({ id: randomUUID(), classId, ...s })))
      .run();
    return roster.length;
  });
}

/** Shapes shared by the server and the browser. */

export type ScanErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_CLOSED'
  | 'TOKEN_INVALID'
  | 'NOT_ON_ROSTER'
  | 'NAME_MISMATCH'
  | 'STUDENT_BOUND_TO_OTHER_DEVICE'
  | 'DEVICE_BOUND_TO_OTHER_STUDENT'
  | 'ALREADY_MARKED'
  | 'DEVICE_ALREADY_MARKED'
  | 'RATE_LIMITED';

export type ScanResult =
  | { ok: true; studentName: string; className: string; markedAt: number }
  | { ok: false; code: ScanErrorCode };

export interface ClassSummary {
  id: string;
  name: string;
  studentCount: number;
  createdAt: number;
}

export interface RosterEntry {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  /** Set when this student has bound a phone for this class. */
  hasDeviceClaim: boolean;
}

export interface AttendanceRow {
  studentId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  markedAt: number | null;
  method: 'scan' | 'manual' | null;
  /** True when this student has a phone bound for the class. */
  hasDeviceClaim: boolean;
}

export interface SessionState {
  id: string;
  classId: string;
  className: string;
  rotationSeconds: number;
  openedAt: number;
  closedAt: number | null;
  headcount: number | null;
  present: AttendanceRow[];
  absent: AttendanceRow[];
}

export interface ScanSessionInfo {
  className: string;
  open: boolean;
  /** False when the QR token was missing or already rotated away. */
  tokenValid: boolean;
  pass: string | null;
  passExpiresAt?: number;
}

export interface TokenResponse {
  /** Full URL to encode in the QR. */
  url: string;
  token: string;
  /** Epoch ms at which this token stops being the current one. */
  expiresAt: number;
}

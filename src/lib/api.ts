import type {
  ClassSummary,
  RosterEntry,
  ScanResult,
  ScanSessionInfo,
  SessionState,
  TokenResponse,
} from '../../shared/types.js';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const json = (body: unknown) => ({ body: JSON.stringify(body) });

export const api = {
  listClasses: () => request<ClassSummary[]>('/api/teacher/classes'),

  createClass: (name: string) =>
    request<ClassSummary>('/api/teacher/classes', { method: 'POST', ...json({ name }) }),

  deleteClass: (id: string) =>
    request<void>(`/api/teacher/classes/${id}`, { method: 'DELETE' }),

  getRoster: (classId: string) => request<RosterEntry[]>(`/api/teacher/classes/${classId}/roster`),

  importRoster: (classId: string, text: string) =>
    request<{ imported: number; skipped: number[] }>(`/api/teacher/classes/${classId}/roster`, {
      method: 'POST',
      ...json({ text }),
    }),

  releaseDevice: (classId: string, studentId: string) =>
    request<{ released: number }>(
      `/api/teacher/classes/${classId}/roster/${studentId}/release-device`,
      { method: 'POST' },
    ),

  releaseAllDevices: (classId: string) =>
    request<{ released: number }>(`/api/teacher/classes/${classId}/release-devices`, {
      method: 'POST',
    }),

  openSession: (classId: string) =>
    request<{ id: string }>(`/api/teacher/classes/${classId}/sessions`, {
      method: 'POST',
      ...json({}),
    }),

  getSession: (id: string) => request<SessionState>(`/api/teacher/sessions/${id}`),

  getToken: (id: string) => request<TokenResponse>(`/api/teacher/sessions/${id}/token`),

  closeSession: (id: string) =>
    request<void>(`/api/teacher/sessions/${id}/close`, { method: 'POST' }),

  setHeadcount: (id: string, count: number | null) =>
    request<void>(`/api/teacher/sessions/${id}/headcount`, { method: 'POST', ...json({ count }) }),

  mark: (sessionId: string, studentId: string) =>
    request<void>(`/api/teacher/sessions/${sessionId}/mark`, {
      method: 'POST',
      ...json({ studentId }),
    }),

  unmark: (sessionId: string, studentId: string) =>
    request<void>(`/api/teacher/sessions/${sessionId}/mark/${studentId}`, { method: 'DELETE' }),

  csvUrl: (sessionId: string) => `/api/teacher/sessions/${sessionId}/export.csv`,

  getScanSession: (sessionId: string, token: string) =>
    request<ScanSessionInfo>(`/api/scan/${sessionId}?t=${encodeURIComponent(token)}`),

  submitScan: async (
    sessionId: string,
    body: { pass: string; studentNumber: string; lastName: string },
  ): Promise<ScanResult> => {
    const res = await fetch(`/api/scan/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as ScanResult;
  },
};

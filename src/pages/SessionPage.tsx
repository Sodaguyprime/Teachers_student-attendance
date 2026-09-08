import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { SessionState } from '../../shared/types.js';
import { api } from '../lib/api.js';
import { Button, Card, Empty, Label, Spinner, formatTime } from '../components/ui.js';

export function SessionPage({
  sessionId,
  onNavigate,
}: {
  sessionId: string;
  onNavigate: (to: string) => void;
}) {
  const [state, setState] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setState(await api.getSession(sessionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load session');
    }
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await api.getSession(sessionId);
        if (!cancelled) setState(next);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load session');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Students appear the moment they scan, rather than on a poll.
  useEffect(() => {
    const source = new EventSource(`/api/teacher/sessions/${sessionId}/events`);
    source.addEventListener('attendance', () => void refresh());
    source.addEventListener('closed', () => void refresh());
    return () => source.close();
  }, [sessionId, refresh]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-6 py-20">
        <div className="rounded-lg border border-alert/20 bg-alert-soft p-4 text-sm text-alert">
          {error}
        </div>
        <Button className="mt-4" onClick={() => onNavigate('/')}>
          Back to classes
        </Button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const open = state.closedAt === null;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="no-print mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('/')}
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint hover:text-ink"
          >
            &larr; Classes
          </button>
          <h1 className="mt-2 font-display text-4xl leading-tight">{state.className}</h1>
          <p className="mt-1.5 text-sm text-muted">
            {open ? 'Taking attendance' : 'Closed'} &middot; opened {formatTime(state.openedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a href={api.csvUrl(sessionId)} download>
            <Button>Export CSV</Button>
          </a>
          <Button onClick={() => window.print()}>Print / PDF</Button>
          {open ? (
            <Button
              variant="primary"
              onClick={async () => {
                await api.closeSession(sessionId);
                await refresh();
              }}
            >
              Close attendance
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="no-print space-y-6">
          {open ? <QrPanel sessionId={sessionId} /> : null}
          <HeadcountPanel state={state} onChanged={refresh} />
        </div>

        <div className="space-y-6">
          <PresentPanel state={state} onChanged={refresh} open={open} />
          <AbsentPanel state={state} onChanged={refresh} />
        </div>
      </div>
    </div>
  );
}

/**
 * The projected code. The session secret stays on the server, so the page asks
 * for the current token and refreshes itself the moment it stops being current.
 */
function QrPanel({ sessionId }: { sessionId: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const next = await api.getToken(sessionId);
        if (cancelled) return;
        setUrl(next.url);
        setDataUrl(
          await QRCode.toDataURL(next.url, {
            margin: 1,
            width: 720,
            errorCorrectionLevel: 'M',
            color: { dark: '#1a1917', light: '#ffffff' },
          }),
        );
        setFailed(false);
        // Refresh just after this token stops being the current one.
        timer.current = setTimeout(tick, Math.max(1000, next.expiresAt - Date.now() + 150));
      } catch {
        if (!cancelled) {
          setFailed(true);
          timer.current = setTimeout(tick, 3000);
        }
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [sessionId]);

  return (
    <Card className="p-5">
      <Label>Scan to sign in</Label>
      <div className="mt-3 aspect-square w-full overflow-hidden rounded-lg border border-line bg-white">
        {dataUrl ? (
          <img src={dataUrl} alt="Attendance QR code" className="size-full" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        The code changes every few seconds, so a screenshot passed to someone outside the room stops
        working almost immediately.
      </p>

      {failed ? (
        <p className="mt-2 text-xs text-alert">Lost contact with the server. Retrying.</p>
      ) : null}

      {url ? (
        <p className="mt-3 break-all font-mono text-[11px] text-faint">
          {url.replace(/\?t=.*$/, '')}
        </p>
      ) : null}
    </Card>
  );
}

/**
 * The check the cryptography cannot do: how many people are actually in the room.
 * Device binding stops one phone marking two students; it cannot stop a student
 * carrying a friend's phone. Comparing bodies to rows catches that.
 */
function HeadcountPanel({
  state,
  onChanged,
}: {
  state: SessionState;
  onChanged: () => Promise<void>;
}) {
  const [value, setValue] = useState(state.headcount?.toString() ?? '');
  const marked = state.present.length;
  const counted = state.headcount;

  async function save(next: string) {
    setValue(next);
    const parsed = next.trim() === '' ? null : Number(next);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 0)) return;
    await api.setHeadcount(state.id, parsed);
    await onChanged();
  }

  const gap = counted === null ? null : marked - counted;

  return (
    <Card className="p-5">
      <Label>Headcount check</Label>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Count the people in the room and enter it here. If more students are marked than are
        present, someone signed in for a friend.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={value}
          onChange={(e) => void save(e.target.value)}
          placeholder="—"
          aria-label="Students counted in the room"
          className="tnum w-24 rounded-lg border border-line bg-card px-3 py-2 text-center text-lg focus:border-ink focus:outline-none"
        />
        <div className="text-sm text-muted">
          counted &middot; <span className="tnum font-medium text-ink">{marked}</span> marked
        </div>
      </div>

      {gap !== null && gap > 0 ? (
        <p className="mt-4 rounded-lg border border-alert/20 bg-alert-soft p-3 text-sm text-alert">
          <strong className="font-semibold">
            {gap} more marked than counted.
          </strong>{' '}
          Check the list against the room before exporting.
        </p>
      ) : null}

      {gap !== null && gap < 0 ? (
        <p className="mt-4 rounded-lg border border-warn/20 bg-warn-soft p-3 text-sm text-warn">
          <strong className="font-semibold">{-gap} in the room have not signed in.</strong> Ask
          before you close, then mark them by hand.
        </p>
      ) : null}

      {gap === 0 ? (
        <p className="mt-4 rounded-lg border border-present/20 bg-present-soft p-3 text-sm text-present">
          Counted and marked agree.
        </p>
      ) : null}
    </Card>
  );
}

function PresentPanel({
  state,
  onChanged,
  open,
}: {
  state: SessionState;
  onChanged: () => Promise<void>;
  open: boolean;
}) {
  return (
    <Card className="print-plain overflow-hidden">
      <div className="flex items-baseline justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-xl">Present</h2>
        <span className="tnum text-sm text-muted">
          {state.present.length} of {state.present.length + state.absent.length}
        </span>
      </div>

      {state.present.length === 0 ? (
        <Empty>
          {open ? 'Waiting for the first scan.' : 'Nobody was marked present.'}
        </Empty>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
                Number
              </th>
              <th className="px-2 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
                Name
              </th>
              <th className="px-2 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
                Time
              </th>
              <th className="no-print px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {state.present.map((row) => (
              <tr key={row.studentId} className="border-b border-line last:border-0">
                <td className="tnum w-28 px-5 py-2.5 text-muted">{row.studentNumber}</td>
                <td className="px-2 py-2.5">
                  {row.firstName} {row.lastName}
                </td>
                <td className="tnum w-32 px-2 py-2.5 text-muted">
                  {formatTime(row.markedAt ?? 0)}
                  {row.method === 'manual' ? (
                    <span className="ml-2 text-xs text-faint">by hand</span>
                  ) : null}
                </td>
                <td className="no-print w-24 px-5 py-2.5 text-right">
                  <button
                    onClick={async () => {
                      await api.unmark(state.id, row.studentId);
                      await onChanged();
                    }}
                    className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-alert"
                  >
                    remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function AbsentPanel({
  state,
  onChanged,
}: {
  state: SessionState;
  onChanged: () => Promise<void>;
}) {
  return (
    <Card className="print-plain overflow-hidden">
      <div className="flex items-baseline justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-xl">Not signed in</h2>
        <span className="tnum text-sm text-muted">{state.absent.length}</span>
      </div>

      {state.absent.length === 0 ? (
        <Empty>Everyone on the roster is marked present.</Empty>
      ) : (
        <>
          <p className="no-print border-b border-line px-5 py-3 text-xs leading-relaxed text-muted">
            If a student says their phone would not work, mark them here rather than leaving them
            absent. If they have changed phone, reset theirs and let them scan again.
          </p>
          <table className="w-full text-sm">
            <tbody>
              {state.absent.map((row) => (
                <tr key={row.studentId} className="border-b border-line last:border-0">
                  <td className="tnum w-28 px-5 py-2.5 text-muted">{row.studentNumber}</td>
                  <td className="px-2 py-2.5">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="no-print w-56 px-5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      {row.hasDeviceClaim ? (
                        <button
                          onClick={async () => {
                            await api.releaseDevice(state.classId, row.studentId);
                            await onChanged();
                          }}
                          className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-ink"
                          title="Unbind their old phone so they can scan from a new one"
                        >
                          reset phone
                        </button>
                      ) : null}
                      <button
                        onClick={async () => {
                          await api.mark(state.id, row.studentId);
                          await onChanged();
                        }}
                        className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-ink"
                      >
                        mark present
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Card>
  );
}

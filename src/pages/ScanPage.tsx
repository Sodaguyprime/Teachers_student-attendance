import { useEffect, useState, type FormEvent } from 'react';
import type { ScanErrorCode, ScanSessionInfo } from '../../shared/types.js';
import { api } from '../lib/api.js';
import { Button, Card, Field, Spinner, inputClass } from '../components/ui.js';

/** What a student sees. Every failure has to say what to do next. */
const MESSAGES: Record<ScanErrorCode, { title: string; detail: string }> = {
  SESSION_NOT_FOUND: {
    title: 'This code is not for a class we know',
    detail: 'Scan the code on the screen again.',
  },
  SESSION_CLOSED: {
    title: 'Attendance is closed',
    detail: 'Your teacher has finished taking attendance for this class.',
  },
  TOKEN_INVALID: {
    title: 'This code has expired',
    detail: 'The code on the screen changes every few seconds. Scan the current one.',
  },
  NOT_ON_ROSTER: {
    title: 'That number is not on this class list',
    detail: 'Check the digits. If it is right, you may be registered under a different class.',
  },
  NAME_MISMATCH: {
    title: 'The surname does not match that number',
    detail: 'Enter the surname exactly as it appears on your student record.',
  },
  STUDENT_BOUND_TO_OTHER_DEVICE: {
    title: 'Your number is registered to a different phone',
    detail: 'You signed in for this class on another device before.',
  },
  DEVICE_BOUND_TO_OTHER_STUDENT: {
    title: 'This phone is already registered to another student',
    detail: 'Each phone can only be used for one student in a class.',
  },
  ALREADY_MARKED: {
    title: 'You are already marked present',
    detail: 'Nothing more to do.',
  },
  DEVICE_ALREADY_MARKED: {
    title: 'This phone has already been used for this class today',
    detail: 'One phone can mark attendance once per session.',
  },
  RATE_LIMITED: {
    title: 'Too many attempts',
    detail: 'Wait a minute before trying again.',
  },
};

type State =
  | { kind: 'loading' }
  | { kind: 'unavailable'; title: string; detail: string }
  | { kind: 'form'; className: string; pass: string }
  | { kind: 'done'; studentName: string; className: string; markedAt: number };

export function ScanPage({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [studentNumber, setStudentNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<{ title: string; detail: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('t') ?? '';
    let cancelled = false;

    void (async () => {
      let info: ScanSessionInfo;
      try {
        info = await api.getScanSession(sessionId, token);
      } catch {
        if (!cancelled) setState({ kind: 'unavailable', ...MESSAGES.SESSION_NOT_FOUND });
        return;
      }
      if (cancelled) return;

      if (!info.open) {
        setState({ kind: 'unavailable', ...MESSAGES.SESSION_CLOSED });
      } else if (!info.tokenValid || !info.pass) {
        setState({ kind: 'unavailable', ...MESSAGES.TOKEN_INVALID });
      } else {
        setState({ kind: 'form', className: info.className, pass: info.pass });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.kind !== 'form' || submitting) return;

    setSubmitting(true);
    setError(null);
    const result = await api.submitScan(sessionId, {
      pass: state.pass,
      studentNumber,
      lastName,
    });
    setSubmitting(false);

    if (result.ok) {
      setState({
        kind: 'done',
        studentName: result.studentName,
        className: result.className,
        markedAt: result.markedAt,
      });
    } else {
      setError(MESSAGES[result.code]);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      {state.kind === 'loading' ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : null}

      {state.kind === 'unavailable' ? (
        <Notice title={state.title} detail={state.detail} tone="warn" />
      ) : null}

      {state.kind === 'done' ? (
        <Card className="p-7 text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-present-soft text-present">
            <svg
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden
            >
              <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display text-2xl">Marked present</h1>
          <p className="mt-2 text-sm text-muted">
            {state.studentName} &middot; {state.className}
          </p>
          <p className="tnum mt-1 text-sm text-faint">
            {new Date(state.markedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </Card>
      ) : null}

      {state.kind === 'form' ? (
        <>
          <header className="mb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
              Attendance
            </p>
            <h1 className="mt-1.5 font-display text-3xl leading-tight">{state.className}</h1>
          </header>

          <Card className="p-5">
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Student number">
                <input
                  className={inputClass}
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  required
                />
              </Field>

              <Field label="Surname" hint="As it appears on your student record.">
                <input
                  className={inputClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </Field>

              {error ? <Notice title={error.title} detail={error.detail} tone="alert" /> : null}

              <Button type="submit" variant="primary" className="w-full py-3" disabled={submitting}>
                {submitting ? <Spinner /> : null}
                {submitting ? 'Submitting' : 'Mark me present'}
              </Button>
            </form>
          </Card>
        </>
      ) : null}

      {state.kind !== 'done' && state.kind !== 'loading' ? <TroubleNote /> : null}
    </main>
  );
}

function Notice({
  title,
  detail,
  tone,
}: {
  title: string;
  detail: string;
  tone: 'warn' | 'alert';
}) {
  const styles =
    tone === 'alert'
      ? 'border-alert/20 bg-alert-soft text-alert'
      : 'border-warn/20 bg-warn-soft text-warn';
  return (
    <div className={`rounded-lg border p-4 ${styles}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-80">{detail}</p>
    </div>
  );
}

/** The fallback that keeps a broken phone from becoming a missed class. */
function TroubleNote() {
  return (
    <p className="mt-6 px-1 text-center text-sm leading-relaxed text-muted">
      Trouble signing in? Tell your teacher{' '}
      <strong className="font-semibold text-ink">before you leave the room</strong> &mdash; they can
      mark you present by hand, even after the codes stop showing.
    </p>
  );
}

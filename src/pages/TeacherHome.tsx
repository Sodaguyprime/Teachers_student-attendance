import { useCallback, useEffect, useState } from 'react';
import type { ClassSummary, RosterEntry } from '../../shared/types.js';
import { api } from '../lib/api.js';
import { Button, Card, Empty, Field, Label, Spinner, inputClass } from '../components/ui.js';

export function TeacherHome({ onNavigate }: { onNavigate: (to: string) => void }) {
  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await api.listClasses();
      setClasses(next);
      setSelectedId((current) => current ?? next[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load classes');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await api.listClasses();
        if (cancelled) return;
        setClasses(next);
        setSelectedId((current) => current ?? next[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load classes');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = classes?.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
          Attendance
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight">Classes</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          Import a roster once, then open a session whenever you teach. Students scan the code on
          screen and appear here as they do.
        </p>
      </header>

      {error ? (
        <div className="mb-6 rounded-lg border border-alert/20 bg-alert-soft p-4 text-sm text-alert">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr]">
        <ClassList
          classes={classes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreated={refresh}
        />
        {selected ? (
          <ClassDetail
            key={selected.id}
            summary={selected}
            onChanged={refresh}
            onDeleted={() => {
              setSelectedId(null);
              void refresh();
            }}
            onNavigate={onNavigate}
          />
        ) : (
          <Card className="flex items-center justify-center p-10">
            <Empty>Create a class to get started.</Empty>
          </Card>
        )}
      </div>
    </div>
  );
}

function ClassList({
  classes,
  selectedId,
  onSelect,
  onCreated,
}: {
  classes: ClassSummary[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const created = await api.createClass(name.trim()).catch(() => null);
    setBusy(false);
    if (created) {
      setName('');
      await onCreated();
      onSelect(created.id);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        {classes === null ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : classes.length === 0 ? (
          <Empty>No classes yet.</Empty>
        ) : (
          <ul>
            {classes.map((c) => (
              <li key={c.id} className="border-b border-line last:border-0">
                <button
                  onClick={() => onSelect(c.id)}
                  className={`flex w-full items-baseline justify-between gap-3 px-4 py-3 text-left transition-colors ${
                    c.id === selectedId ? 'bg-paper' : 'hover:bg-paper/60'
                  }`}
                >
                  <span className="truncate text-sm font-medium">{c.name}</span>
                  <span className="tnum shrink-0 text-xs text-faint">{c.studentCount}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <form onSubmit={create} className="flex gap-2">
        <input
          className={inputClass}
          placeholder="New class name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="New class name"
        />
        <Button type="submit" variant="primary" disabled={!name.trim() || busy}>
          Add
        </Button>
      </form>
    </div>
  );
}

function ClassDetail({
  summary,
  onChanged,
  onDeleted,
  onNavigate,
}: {
  summary: ClassSummary;
  onChanged: () => Promise<void>;
  onDeleted: () => void;
  onNavigate: (to: string) => void;
}) {
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number[] } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const loadRoster = useCallback(async () => {
    setRoster(await api.getRoster(summary.id).catch(() => []));
  }, [summary.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await api.getRoster(summary.id).catch(() => []);
      if (!cancelled) setRoster(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [summary.id]);

  async function runImport() {
    if (!importText.trim() || importing) return;
    setImporting(true);
    const res = await api.importRoster(summary.id, importText).catch(() => null);
    setImporting(false);
    if (res) {
      setResult(res);
      setImportText('');
      await loadRoster();
      await onChanged();
    }
  }

  async function startSession() {
    const session = await api.openSession(summary.id).catch(() => null);
    if (session) onNavigate(`/session/${session.id}`);
  }

  const hasRoster = (roster?.length ?? 0) > 0;
  const boundCount = roster?.filter((r) => r.hasDeviceClaim).length ?? 0;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">{summary.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {summary.studentCount} {summary.studentCount === 1 ? 'student' : 'students'} on the
            roster
          </p>
        </div>
        <Button variant="primary" onClick={startSession} disabled={!hasRoster}>
          Take attendance
        </Button>
      </div>

      {!hasRoster ? (
        <p className="mt-4 rounded-lg border border-warn/20 bg-warn-soft p-3 text-sm text-warn">
          Import a roster before taking attendance &mdash; only students on the list can sign in.
        </p>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label>Roster</Label>
          {boundCount > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">
                {boundCount} {boundCount === 1 ? 'phone' : 'phones'} bound
              </span>
              {confirmingReset ? (
                <>
                  <Button
                    variant="danger"
                    className="px-2.5 py-1 text-xs"
                    onClick={async () => {
                      await api.releaseAllDevices(summary.id);
                      setConfirmingReset(false);
                      await loadRoster();
                    }}
                  >
                    Reset all {boundCount}
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    onClick={() => setConfirmingReset(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  className="px-2.5 py-1 text-xs"
                  onClick={() => setConfirmingReset(true)}
                  title="Clear every phone binding in this class, for a new term or a reshuffled group"
                >
                  Reset all phones
                </Button>
              )}
            </div>
          ) : null}
        </div>
        <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted">
          A student is tied to the first phone they sign in from. Reset it when someone changes
          phone, or resets are refused as a second-device attempt.
        </p>
        <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-line">
          {roster === null ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : roster.length === 0 ? (
            <Empty>Nobody imported yet.</Empty>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {roster.map((student) => (
                  <tr key={student.id} className="border-b border-line last:border-0">
                    <td className="tnum w-28 px-4 py-2.5 text-muted">{student.studentNumber}</td>
                    <td className="px-2 py-2.5">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="w-44 px-4 py-2.5 text-right">
                      {student.hasDeviceClaim ? (
                        <button
                          onClick={async () => {
                            await api.releaseDevice(summary.id, student.id);
                            await loadRoster();
                          }}
                          className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-ink"
                          title="Unbind this student from the phone they registered, so they can sign in from a new one"
                        >
                          phone bound &middot; reset
                        </button>
                      ) : (
                        <span className="text-xs text-faint">no phone yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-8">
        <Field
          label="Import roster"
          hint="One student per line: number, first name, surname. Importing replaces the current list."
        >
          <textarea
            className={`${inputClass} min-h-28 font-mono text-sm`}
            placeholder={'22109046, Ammar, Mirghani\n22110643, Mohammed, Saif'}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
        </Field>
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={runImport} disabled={!importText.trim() || importing}>
            {importing ? 'Importing' : 'Import'}
          </Button>
          {result ? (
            <p className="text-sm text-muted">
              Imported {result.imported}.
              {result.skipped.length > 0
                ? ` Skipped line${result.skipped.length === 1 ? '' : 's'} ${result.skipped.join(', ')}.`
                : ''}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-8 border-t border-line pt-5">
        {confirmingDelete ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted">
              Delete <strong className="text-ink">{summary.name}</strong> with its roster and all
              past sessions?
            </p>
            <Button
              variant="danger"
              onClick={async () => {
                await api.deleteClass(summary.id);
                onDeleted();
              }}
            >
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
            Delete class
          </Button>
        )}
      </section>
    </Card>
  );
}

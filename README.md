# Attendance

Classroom attendance by QR code. The teacher projects a code that changes every ten
seconds; students scan it and sign in from their phones. A code cannot be reused from
the same phone, and a student number cannot be used from a second phone.

Built as a rewrite of a university hackathon project. The original is preserved at the
[`v0-hackathon`](../../tree/v0-hackathon) tag.

## Running it

```bash
npm install
npm run dev
```

The teacher dashboard is at <http://localhost:5173>. Students on the same WiFi open the
address printed in the terminal.

For the single-process version:

```bash
npm run build
npm start          # http://localhost:3000
```

Data lives in `.data/attendance.db` (SQLite, gitignored). Nothing is sent anywhere.

## How it works

1. Create a class and paste in a roster — `number, first name, surname` per line.
2. Open a session. The QR code appears and starts rotating.
3. Students scan, enter their number and surname, and appear on your screen live.
4. Enter your headcount, then close the session and export.

## The security model

The original version had three holes, and each one shaped a decision here.

### Codes expire, and are not stored

The old server kept the current token in a mutable variable with no expiry, so a
screenshot worked until the next rotation and there was a race between rotating the code
and a student submitting it.

Each session now gets a 32-byte secret, and the token is derived from it TOTP-style:

```
token = HMAC-SHA256(sessionSecret, sessionId | floor(now / 10s))
```

Nothing is written down. The server recomputes the current window and the one before it,
so a token is valid for at most about twenty seconds, and there is no shared mutable
state to race. Comparison is constant-time.

Since twenty seconds is not long enough to type a student number, the token is exchanged
once on page load for a **scan pass** — a signed value bound to the session, the device
and a five-minute expiry. The token proves you were looking at the projected code; the
pass gives you time to fill the form in. Forwarding a pass to a friend fails, because
their device hash will not match the one it was signed for.

### One phone, one student

The old check was by IP address, which is broken in both directions: on campus WiFi the
whole class shares one NAT address, so the first student would have locked out everyone
else, and switching to mobile data defeats it entirely.

Instead each browser holds a random UUID in a signed, httpOnly cookie. Only its SHA-256
is stored, so the database never contains a value that could be replayed into a cookie.
The rules are unique indexes rather than application code, so they cannot be raced or
forgotten:

| Constraint | Stops |
|---|---|
| `attendance (session_id, student_id)` | a student being marked twice in one session |
| `attendance (session_id, device_hash)` | one phone marking twice in one session |
| `device_claims (class_id, student_id)` | a student signing in from a second phone |
| `device_claims (class_id, device_hash)` | a phone being used for a second student |

The first scan binds a student number to a phone for the whole class. The teacher can
release that binding from the roster when someone changes device.

Every rejection is decided before anything is written, so a failed scan never leaves a
binding behind.

### Identity is checked against a roster

Anyone could previously type any student number. Now only numbers on the imported roster
are accepted, and the surname has to match.

### What this does not solve

**A student can carry a friend's phone into the room.** No amount of cryptography sees
the room, so the app does not pretend to. The session screen asks for a headcount and
compares it to the number of rows: if 31 are marked and you counted 28, it says so before
you export.

**Clearing cookies gets a fresh device identity.** It is a deterrent, not a proof. The
headcount is the backstop.

Students who cannot sign in are told, on the scan page, to speak to the teacher before
leaving, and the session screen lets you mark anyone by hand. Manual rows are recorded as
`manual` and labelled in the export, so an audit can tell them apart from scans.

### Other measures

- **The teacher API is loopback-only.** There is no teacher password by design, so the
  dashboard is served only to the machine running the app. Students on the same WiFi can
  reach the scan page and get a 403 on everything else. `X-Forwarded-For` is trusted only
  when the socket is itself loopback, so a LAN request cannot spoof its way in.
- **No CDN scripts.** Everything is bundled, so a strict CSP holds: `default-src 'self'`,
  `object-src 'none'`, `frame-ancestors 'none'`.
- **No `xlsx` or `jsPDF`.** The original loaded four scripts from a CDN, including
  `xlsx@0.18.5`, which has known prototype-pollution advisories and is unmaintained on
  npm. Export is CSV (which Excel opens natively) plus a print stylesheet for PDF — zero
  dependencies. CSV fields are quoted and leading `=`, `+`, `-`, `@` are escaped so a
  crafted name cannot become a live formula.
- **Every request body is validated with Zod**; the scan endpoint is rate limited per
  device.

## Stack

TypeScript throughout. [Hono](https://hono.dev) on Node, SQLite via
[Drizzle](https://orm.drizzle.team), React + Vite + Tailwind, Vitest. Server-sent events
push new scans to the teacher's screen. One process serves the API and the built client.

```
server/
  lib/          tokens, scan passes, device cookies, rate limiting, headers
  services/     the scan decision, roster parsing, queries and export
  routes/       teacher API (loopback-only) and the public scan API
  db/           schema and connection
src/            React client — teacher dashboard, session screen, scan page
shared/         types used by both sides
tests/          the security core
```

## Tests

```bash
npm test
```

28 tests over the parts where a mistake means wrong attendance: token rotation and
expiry, pass binding, and every rejection path in the scan decision — wrong surname,
unknown number, second device, second student, closed session, and the invariant that a
rejected scan leaves no binding behind.

## Credits

Originally built for a hackathon at Cyprus International University by Ammar Mirghani,
Mohammed Saif and Lina.

MIT.

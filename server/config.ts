import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const DATA_DIR = resolve(process.cwd(), '.data');
export const DB_PATH = process.env.DB_PATH ?? resolve(DATA_DIR, 'attendance.db');
export const PORT = Number(process.env.PORT ?? 3000);
/** `npm start` passes --prod, which works the same on Windows and POSIX shells. */
export const IS_PROD =
  process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

/**
 * Secret used to sign device cookies. Generated on first run and kept in a
 * gitignored file so device bindings survive a restart. Override with
 * SERVER_SECRET in a real deployment.
 */
export function loadServerSecret(): string {
  const fromEnv = process.env.SERVER_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;

  const secretPath = resolve(DATA_DIR, 'server-secret');
  if (existsSync(secretPath)) return readFileSync(secretPath, 'utf8').trim();

  mkdirSync(dirname(secretPath), { recursive: true });
  const secret = randomBytes(32).toString('hex');
  writeFileSync(secretPath, secret, { mode: 0o600 });
  return secret;
}

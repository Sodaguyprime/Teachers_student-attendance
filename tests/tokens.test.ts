import { describe, expect, it } from 'vitest';
import {
  createSessionSecret,
  currentToken,
  makeToken,
  verifyToken,
  windowFor,
} from '../server/lib/tokens.js';

const SESSION = 'session-1';
const ROTATION = 10;

describe('rotating tokens', () => {
  it('accepts the token for the current window', () => {
    const secret = createSessionSecret();
    const now = 1_700_000_000_000;
    const { token } = currentToken(secret, SESSION, ROTATION, now);
    expect(verifyToken(secret, SESSION, ROTATION, token, now)).toBe(true);
  });

  it('still accepts a token one window old, so a scan in flight is not lost', () => {
    const secret = createSessionSecret();
    const now = 1_700_000_000_000;
    const { token } = currentToken(secret, SESSION, ROTATION, now);
    expect(verifyToken(secret, SESSION, ROTATION, token, now + ROTATION * 1000)).toBe(true);
  });

  it('rejects a token two windows old, so a screenshot expires', () => {
    const secret = createSessionSecret();
    const now = 1_700_000_000_000;
    const { token } = currentToken(secret, SESSION, ROTATION, now);
    expect(verifyToken(secret, SESSION, ROTATION, token, now + 2 * ROTATION * 1000)).toBe(false);
  });

  it('rejects a token minted for a different session', () => {
    const secret = createSessionSecret();
    const now = 1_700_000_000_000;
    const { token } = currentToken(secret, 'other-session', ROTATION, now);
    expect(verifyToken(secret, SESSION, ROTATION, token, now)).toBe(false);
  });

  it('rejects a token minted with a different secret', () => {
    const now = 1_700_000_000_000;
    const { token } = currentToken(createSessionSecret(), SESSION, ROTATION, now);
    expect(verifyToken(createSessionSecret(), SESSION, ROTATION, token, now)).toBe(false);
  });

  it('rejects junk without throwing', () => {
    const secret = createSessionSecret();
    for (const junk of ['', 'x', 'a'.repeat(64), '../../etc/passwd']) {
      expect(verifyToken(secret, SESSION, ROTATION, junk)).toBe(false);
    }
  });

  it('changes the token every rotation period', () => {
    const secret = createSessionSecret();
    const base = windowFor(ROTATION, 1_700_000_000_000);
    const seen = new Set(
      Array.from({ length: 20 }, (_, i) => makeToken(secret, SESSION, base + i)),
    );
    expect(seen.size).toBe(20);
  });

  it('reports when the current token stops being current', () => {
    const secret = createSessionSecret();
    const now = 1_700_000_003_500;
    const { expiresAt } = currentToken(secret, SESSION, ROTATION, now);
    expect(expiresAt).toBe(1_700_000_010_000);
  });
});

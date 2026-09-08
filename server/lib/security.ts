import type { MiddlewareHandler } from 'hono';
import { isLoopback } from './net.js';

/**
 * The address the request really came from.
 *
 * X-Forwarded-For is only trusted when the socket itself is loopback, i.e. the
 * request arrived through the local Vite dev proxy. A request off the network
 * cannot spoof its way to a loopback address.
 */
export function clientAddress(socketAddress: string | undefined, forwardedFor: string | undefined): string | undefined {
  if (isLoopback(socketAddress) && forwardedFor) {
    return forwardedFor.split(',')[0]?.trim();
  }
  return socketAddress;
}

/**
 * The teacher dashboard has no password by design, so it is served only to the
 * machine running the app. Students on the same WiFi can reach the scan page and
 * nothing else.
 */
export function loopbackOnly(getAddress: (c: Parameters<MiddlewareHandler>[0]) => string | undefined): MiddlewareHandler {
  return async (c, next) => {
    const address = clientAddress(getAddress(c), c.req.header('x-forwarded-for'));
    if (!isLoopback(address)) {
      return c.json({ error: 'The teacher dashboard is only available on the host machine.' }, 403);
    }
    await next();
  };
}

export function securityHeaders(isProd: boolean): MiddlewareHandler {
  const csp = isProd
    ? [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "connect-src 'self'",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; ')
    : null;

  return async (c, next) => {
    await next();
    if (csp) c.header('Content-Security-Policy', csp);
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    c.header('Cross-Origin-Opener-Policy', 'same-origin');
  };
}

/**
 * Fixed-window rate limiter, in memory.
 *
 * Only guards the public scan endpoint against someone brute-forcing student
 * numbers or hammering tokens. The real correctness guarantees are the unique
 * indexes, not this.
 */
export class RateLimiter {
  #hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now = Date.now()): boolean {
    const entry = this.#hits.get(key);
    if (!entry || now >= entry.resetAt) {
      this.#hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (entry.count >= this.limit) return false;
    entry.count++;
    return true;
  }

  /** Drops expired buckets so the map cannot grow without bound. */
  sweep(now = Date.now()): void {
    for (const [key, entry] of this.#hits) {
      if (now >= entry.resetAt) this.#hits.delete(key);
    }
  }
}

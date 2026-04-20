/**
 * Simple per-key rate limiting for the public v1 API.
 *
 * Beta posture — intentionally a single-process in-memory sliding window:
 *   - One web dyno: correct out of the box.
 *   - Multi-dyno: each process enforces its own window, which is a cheap
 *     under-approximation (real limit is N * quota for N processes). That
 *     is acceptable for beta; a Redis-backed limiter can replace this
 *     implementation behind the `RateLimiter` interface without callers
 *     changing.
 *
 * The limiter is pure in its inputs: callers pass `now` explicitly (wall
 * clock via `Date.now()` in production, fixed millis in tests). This keeps
 * the tests deterministic and avoids a `setInterval`-based reset loop that
 * would leak timers between test cases.
 */

export type RateLimitTier = 'beta' | 'standard' | 'internal';

export type RateLimitQuota = {
  /** Max requests allowed inside the window. */
  limit: number;
  /** Window width in milliseconds. */
  windowMs: number;
};

/** Default per-tier quotas. Beta is intentionally conservative. */
export const DEFAULT_QUOTAS: Record<RateLimitTier, RateLimitQuota> = {
  beta: { limit: 60, windowMs: 60_000 },
  standard: { limit: 600, windowMs: 60_000 },
  internal: { limit: 6_000, windowMs: 60_000 },
};

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch millis when the current window closes. */
  resetAt: number;
  /** Seconds until the current window closes (>=0, rounded up). */
  retryAfterSeconds: number;
};

type WindowState = {
  windowStart: number;
  count: number;
};

export interface RateLimiter {
  check(bucket: string, tier: RateLimitTier, now: number): RateLimitDecision;
  reset(bucket?: string): void;
  size(): number;
}

/**
 * Fixed-window counter keyed by `bucket`. A bucket is typically an
 * api_key_id for authenticated traffic or a normalized client IP for
 * unauthenticated traffic — this module does not assume which.
 *
 * The counter is evicted lazily when a request arrives after its window
 * has closed, so an unbounded set of buckets cannot accumulate stale state
 * as long as each bucket keeps making requests. `sweep` is available for
 * callers that want to enforce a cap.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly quotas: Record<RateLimitTier, RateLimitQuota>;
  private readonly state = new Map<string, WindowState>();

  constructor(quotas: Record<RateLimitTier, RateLimitQuota> = DEFAULT_QUOTAS) {
    this.quotas = quotas;
  }

  check(bucket: string, tier: RateLimitTier, now: number): RateLimitDecision {
    if (bucket.length === 0) {
      throw new Error('RateLimiter.check requires a non-empty bucket');
    }
    const quota = this.quotas[tier];
    if (!quota) {
      throw new Error(`RateLimiter.check: unknown tier ${tier}`);
    }

    const current = this.state.get(bucket);
    let window: WindowState;
    if (!current || now - current.windowStart >= quota.windowMs) {
      window = { windowStart: now, count: 0 };
    } else {
      window = current;
    }

    const resetAt = window.windowStart + quota.windowMs;
    const retryAfterSeconds = Math.max(0, Math.ceil((resetAt - now) / 1000));

    if (window.count >= quota.limit) {
      this.state.set(bucket, window);
      return {
        allowed: false,
        limit: quota.limit,
        remaining: 0,
        resetAt,
        retryAfterSeconds,
      };
    }

    window.count += 1;
    this.state.set(bucket, window);

    return {
      allowed: true,
      limit: quota.limit,
      remaining: quota.limit - window.count,
      resetAt,
      retryAfterSeconds,
    };
  }

  reset(bucket?: string): void {
    if (bucket === undefined) {
      this.state.clear();
      return;
    }
    this.state.delete(bucket);
  }

  size(): number {
    return this.state.size;
  }

  /**
   * Drop any bucket whose current window closed before `now`. Useful when
   * the set of authenticated keys is large or callers come from many IPs.
   * Per-bucket tier is not persisted, so the widest configured window is
   * used as a safe upper bound before eviction.
   */
  sweep(now: number): number {
    const maxWindowMs = Math.max(
      this.quotas.beta.windowMs,
      this.quotas.standard.windowMs,
      this.quotas.internal.windowMs,
    );
    let dropped = 0;
    for (const [bucket, window] of this.state) {
      if (now - window.windowStart >= maxWindowMs) {
        this.state.delete(bucket);
        dropped += 1;
      }
    }
    return dropped;
  }
}

/**
 * Rate-limit HTTP response headers, IETF draft-ietf-httpapi-ratelimit-headers
 * style. Kept loose enough that a future upgrade to a sliding log / token
 * bucket doesn't break wire compatibility.
 */
export function rateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  return {
    'RateLimit-Limit': String(decision.limit),
    'RateLimit-Remaining': String(decision.remaining),
    'RateLimit-Reset': String(decision.retryAfterSeconds),
  };
}

/**
 * When a decision rejects a request, the HTTP standard response is `429 Too
 * Many Requests` with `Retry-After` in seconds.
 */
export function retryAfterHeader(decision: RateLimitDecision): Record<string, string> {
  if (decision.allowed) {
    return {};
  }
  return { 'Retry-After': String(decision.retryAfterSeconds) };
}

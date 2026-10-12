import "server-only";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory fixed-window rate limiter. Good enough for a single-node
 * deployment. For multi-instance production, back this with Redis/Upstash.
 */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count++;
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/** Periodically clear expired buckets so the map does not grow forever. */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.resetAt < now) buckets.delete(key);
  }, 60_000).unref?.();
}

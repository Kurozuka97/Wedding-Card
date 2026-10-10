/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for a wedding site — resets on cold start, which is fine.
 */

interface Bucket {
  timestamps: number[];
}

const store = new Map<string, Bucket>();

export function isRateLimited(key: string, maxPerWindow: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = store.get(key) ?? { timestamps: [] };

  // prune old entries
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= maxPerWindow) {
    store.set(key, bucket);
    return true;
  }

  bucket.timestamps.push(now);
  store.set(key, bucket);

  // prevent unbounded growth
  if (store.size > 5000) {
    const oldest = [...store.keys()][0];
    store.delete(oldest);
  }

  return false;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

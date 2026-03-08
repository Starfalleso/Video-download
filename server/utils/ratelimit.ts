/**
 * Simple in-memory rate limiter.
 * No persistence — resets on server restart (volatile by design).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 60s
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 60_000)

/**
 * Check rate limit for a given key (usually IP address).
 * Returns { allowed, remaining, retryAfterMs }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }

  entry.count++

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    }
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    retryAfterMs: 0,
  }
}

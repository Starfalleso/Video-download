/**
 * Simple in-memory rate limiter + concurrent download tracker.
 * No persistence — resets on server restart (volatile by design).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// ── Concurrent download tracking ─────────────────────────────────────
const activeDownloads = new Map<string, number>()
const MAX_CONCURRENT_DOWNLOADS = 3

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

/**
 * Acquire a download slot for an IP.
 * Returns true if the slot was acquired, false if limit reached.
 */
export function acquireDownloadSlot(ip: string): boolean {
  const current = activeDownloads.get(ip) || 0
  if (current >= MAX_CONCURRENT_DOWNLOADS) {
    return false
  }
  activeDownloads.set(ip, current + 1)
  return true
}

/**
 * Release a download slot for an IP.
 */
export function releaseDownloadSlot(ip: string): void {
  const current = activeDownloads.get(ip) || 0
  if (current <= 1) {
    activeDownloads.delete(ip)
  } else {
    activeDownloads.set(ip, current - 1)
  }
}

/**
 * Get current active download count for an IP.
 */
export function getActiveDownloads(ip: string): number {
  return activeDownloads.get(ip) || 0
}

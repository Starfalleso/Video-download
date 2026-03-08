/**
 * Security middleware — applies to all server requests.
 *
 * 1. CORS: Blocks cross-origin API requests (same-origin only for /api/*).
 * 2. Security Headers: Helmet-style headers to harden the response.
 * 3. Request Body Size: Rejects oversized POST bodies (max 1 KB for API).
 */

const MAX_BODY_SIZE = 1024 // 1 KB — our API only accepts small JSON payloads

export default defineEventHandler(async (event) => {
  const path = event.path || ''

  // ── Security Headers (all responses) ──────────────────────────────
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-Permitted-Cross-Domain-Policies': 'none',
  })

  // ── CORS lockdown for API routes ──────────────────────────────────
  if (path.startsWith('/api/')) {
    const origin = getRequestHeader(event, 'origin')
    const host = getRequestHeader(event, 'host')

    // Allow requests with no Origin header (same-origin, curl, etc.)
    // Block requests where Origin doesn't match Host
    if (origin) {
      try {
        const originHost = new URL(origin).host
        if (host && originHost !== host) {
          throw createError({
            statusCode: 403,
            message: 'Cross-origin requests are not allowed.',
          })
        }
      } catch (err: any) {
        if (err.statusCode === 403) throw err
        // Malformed origin — block it
        throw createError({
          statusCode: 403,
          message: 'Invalid origin.',
        })
      }
    }

    // ── Request body size limit for POST requests ─────────────────
    const method = event.method || getMethod(event)
    if (method === 'POST') {
      const contentLength = getRequestHeader(event, 'content-length')
      if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
        throw createError({
          statusCode: 413,
          message: 'Request body too large.',
        })
      }
    }
  }
})

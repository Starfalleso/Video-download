/**
 * Security middleware — applies to all server requests.
 *
 * 1. Content-Security-Policy: restricts what resources the browser can load.
 * 2. CORS: Blocks cross-origin API requests (same-origin only for /api/*).
 * 3. Security Headers: Helmet-style headers to harden the response.
 * 4. Request Body Size: Rejects oversized POST bodies (max 1 KB for API).
 */

const MAX_BODY_SIZE = 1024 // 1 KB — our API only accepts small JSON payloads

/**
 * Content-Security-Policy directives:
 * - script-src 'unsafe-inline': required by Nuxt's inline hydration scripts
 * - style-src 'unsafe-inline': required by Tailwind CSS runtime
 * - img-src https: data:: thumbnail images come from many different CDNs
 * - frame-src youtube.com: YouTube embed preview
 * - connect-src 'self': only our own API (no external XHR/fetch allowed)
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "frame-src https://www.youtube.com",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

export default defineEventHandler(async (event) => {
  const path = event.path || ''

  // ── Security Headers (all responses) ──────────────────────────────
  setResponseHeaders(event, {
    'Content-Security-Policy': CSP,
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

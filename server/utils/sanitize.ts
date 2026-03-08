/**
 * Input sanitization — prevents command injection and malicious input.
 *
 * Even though we use execFile/spawn (which don't invoke a shell), we still
 * sanitize URLs to block data URIs, file:// protocol, and suspicious patterns.
 */

// Characters/patterns that should never appear in a video URL
const DANGEROUS_PATTERNS = [
  /[;&|`$(){}[\]!#]/,          // Shell metacharacters
  /\.\./,                      // Path traversal
  /[\x00-\x1f\x7f]/,          // Control characters
]

// Protocols that should never be passed to yt-dlp
const BLOCKED_PROTOCOLS = ['file:', 'javascript:', 'data:', 'ftp:', 'gopher:', 'ldap:']

// Max URL length to prevent buffer overflow-style attacks
const MAX_URL_LENGTH = 2048

/**
 * Sanitize and validate a URL before passing it to yt-dlp.
 * Returns the sanitized URL or throws an error.
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a non-empty string.')
  }

  const trimmed = url.trim()

  // Length check
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new Error(`URL exceeds maximum length of ${MAX_URL_LENGTH} characters.`)
  }

  // Empty after trim
  if (trimmed.length === 0) {
    throw new Error('URL cannot be empty.')
  }

  // Blocked protocols
  const lowerUrl = trimmed.toLowerCase()
  for (const protocol of BLOCKED_PROTOCOLS) {
    if (lowerUrl.startsWith(protocol)) {
      throw new Error(`Protocol "${protocol}" is not allowed.`)
    }
  }

  // Dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new Error('URL contains invalid characters.')
    }
  }

  // Must be valid http/https URL
  try {
    const parsed = new URL(trimmed)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported.')
    }
    // Ensure hostname exists
    if (!parsed.hostname || parsed.hostname.length === 0) {
      throw new Error('URL must have a valid hostname.')
    }
    // Block localhost / private IPs (SSRF protection)
    const host = parsed.hostname.toLowerCase()
    if (
      host === 'localhost'
      || host === '127.0.0.1'
      || host === '::1'
      || host === '0.0.0.0'
      || host.startsWith('192.168.')
      || host.startsWith('10.')
      || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      throw new Error('Local and private network URLs are not allowed.')
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('Invalid URL')) {
      throw err
    }
    throw new Error('Invalid URL format.')
  }

  return trimmed
}

/**
 * Sanitize a format ID string to prevent injection via yt-dlp -f flag.
 * Format IDs should only contain alphanumerics, +, and /.
 */
export function sanitizeFormatId(formatId: string): string {
  if (!formatId || typeof formatId !== 'string') {
    return 'best'
  }

  const trimmed = formatId.trim()

  // Format IDs should be like: "137", "best", "bestvideo+bestaudio", "137+140"
  if (!/^[a-zA-Z0-9+/[\]_-]{1,64}$/.test(trimmed)) {
    throw new Error('Invalid format ID.')
  }

  return trimmed
}

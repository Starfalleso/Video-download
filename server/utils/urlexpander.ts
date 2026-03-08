/**
 * URL expander — follows redirects on shortened URLs to get the final destination.
 * Supports bit.ly, t.co, tinyurl, vm.tiktok.com, etc.
 * No data persisted — operates in-memory only.
 */

const SHORTENER_PATTERNS = [
  /^https?:\/\/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|dlvr\.it|j\.mp)\//,
  /^https?:\/\/vm\.tiktok\.com\//,
  /^https?:\/\/fb\.watch\//,
  /^https?:\/\/youtu\.be\//,
]

/**
 * Check if a URL is likely a shortened/redirect URL
 */
export function isShortUrl(url: string): boolean {
  return SHORTENER_PATTERNS.some(p => p.test(url.trim()))
}

/**
 * Expand a shortened URL by following redirects.
 * Returns the final URL after all redirects.
 */
export async function expandUrl(url: string): Promise<string> {
  const trimmed = url.trim()

  // Only expand if it looks like a shortener
  if (!isShortUrl(trimmed)) {
    return trimmed
  }

  try {
    // Use HEAD request with redirect: 'manual' to follow redirects step by step
    let currentUrl = trimmed
    let maxRedirects = 10

    while (maxRedirects-- > 0) {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VideoDownloader/1.0)',
        },
      })

      const location = response.headers.get('location')
      if (location && (response.status >= 300 && response.status < 400)) {
        // Handle relative redirects
        currentUrl = location.startsWith('http')
          ? location
          : new URL(location, currentUrl).toString()
      } else {
        break
      }
    }

    return currentUrl
  } catch {
    // If expansion fails, return original URL
    return trimmed
  }
}

/**
 * POST /api/video/info
 *
 * Accepts { url: string } and returns video metadata (title, thumbnail, formats).
 * No files are saved — metadata is fetched and returned in-memory.
 */
import { detectServerPlatform, isValidServerUrl } from '~~/server/utils/validation'
import { getVideoInfo } from '~~/server/utils/ytdlp'
import { checkRateLimit } from '~~/server/utils/ratelimit'
import { expandUrl, isShortUrl } from '~~/server/utils/urlexpander'
import { sanitizeUrl } from '~~/server/utils/sanitize'

export default defineEventHandler(async (event) => {
  // Rate limiting — 15 info requests per minute per IP
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const limit = checkRateLimit(`info:${ip}`, 15, 60_000)
  if (!limit.allowed) {
    throw createError({
      statusCode: 429,
      message: `Too many requests. Please wait ${Math.ceil(limit.retryAfterMs / 1000)} seconds.`,
    })
  }

  const body = await readBody<{ url?: string }>(event)

  if (!body?.url || typeof body.url !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Missing or invalid "url" field.',
    })
  }

  let url: string

  // Sanitize input URL — blocks injection attempts, private IPs, and invalid protocols
  try {
    url = sanitizeUrl(body.url)
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      message: err.message || 'Invalid URL.',
    })
  }

  // Validate URL format
  if (!isValidServerUrl(url)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL.',
    })
  }

  // Expand shortened URLs (bit.ly, t.co, vm.tiktok.com, etc.)
  if (isShortUrl(url)) {
    url = await expandUrl(url)
  }

  // Re-sanitize expanded URL to block SSRF via redirect chains
  try {
    url = sanitizeUrl(url)
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Expanded URL is invalid or targets a blocked destination.',
    })
  }

  // Validate supported platform
  const platform = detectServerPlatform(url)
  if (!platform) {
    throw createError({
      statusCode: 400,
      message: 'Unsupported platform. We support YouTube, TikTok, Instagram, Facebook, and Twitter/X.',
    })
  }

  try {
    const info = await getVideoInfo(url)
    return { ...info, expandedUrl: url, platform }
  } catch (err: any) {
    console.error('[/api/video/info] yt-dlp error:', err.message)

    if (err.code === 'ENOENT') {
      throw createError({
        statusCode: 500,
        message: 'yt-dlp is not installed on the server. Please install it: https://github.com/yt-dlp/yt-dlp#installation',
      })
    }

    // Sanitize error output — never leak raw stderr to the client
    const safeMessage = err.message?.includes('is not a valid URL')
      || err.message?.includes('Unsupported URL')
      ? 'This URL is not supported or could not be processed.'
      : 'Failed to fetch video information.'

    throw createError({
      statusCode: 500,
      message: safeMessage,
    })
  }
})

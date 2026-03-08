/**
 * POST /api/video/download
 *
 * Accepts { url: string, formatId?: string, audioOnly?: boolean } and streams
 * the video/audio directly to the client as a downloadable blob.
 *
 * Privacy: No files are saved to disk. The video is piped from yt-dlp stdout
 * directly to the HTTP response stream, living only in RAM.
 */
import { detectServerPlatform, isValidServerUrl } from '~~/server/utils/validation'
import { streamVideo } from '~~/server/utils/ytdlp'
import { MAX_DOWNLOAD_BYTES } from '~~/server/utils/ytdlp'
import { checkRateLimit, acquireDownloadSlot, releaseDownloadSlot } from '~~/server/utils/ratelimit'
import { expandUrl, isShortUrl } from '~~/server/utils/urlexpander'
import { sanitizeUrl, sanitizeFormatId } from '~~/server/utils/sanitize'

export default defineEventHandler(async (event) => {
  // Rate limiting — 5 downloads per minute per IP
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const limit = checkRateLimit(`download:${ip}`, 5, 60_000)
  if (!limit.allowed) {
    throw createError({
      statusCode: 429,
      message: `Too many downloads. Please wait ${Math.ceil(limit.retryAfterMs / 1000)} seconds.`,
    })
  }

  const body = await readBody<{ url?: string; formatId?: string; audioOnly?: boolean }>(event)

  if (!body?.url || typeof body.url !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Missing or invalid "url" field.',
    })
  }

  let url: string

  // Sanitize input URL — blocks injection, private IPs, dangerous protocols
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
      message: 'Invalid URL format.',
    })
  }

  // Expand shortened URLs
  let finalUrl = url
  if (isShortUrl(url)) {
    finalUrl = await expandUrl(url)
  }

  // Re-sanitize the expanded URL to block SSRF via redirect chains
  try {
    finalUrl = sanitizeUrl(finalUrl)
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      message: 'Expanded URL is invalid or targets a blocked destination.',
    })
  }

  // Validate supported platform
  const platform = detectServerPlatform(finalUrl)
  if (!platform) {
    throw createError({
      statusCode: 400,
      message: 'Unsupported platform.',
    })
  }

  let formatId: string | undefined
  try {
    formatId = body.formatId && typeof body.formatId === 'string'
      ? sanitizeFormatId(body.formatId)
      : undefined
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      message: err.message || 'Invalid format ID.',
    })
  }
  const audioOnly = body.audioOnly === true

  // Acquire download slot AFTER all validation passes — prevents slot leaks on bad input
  if (!acquireDownloadSlot(ip)) {
    throw createError({
      statusCode: 429,
      message: 'Too many simultaneous downloads. Please wait for a current download to finish.',
    })
  }

  try {
    const { process: child, filename, contentType } = streamVideo(finalUrl, formatId, audioOnly)

    // Set response headers for file download
    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    })

    // Collect stderr for error reporting
    let stderr = ''
    child.stderr?.on('data', (chunk: { toString: () => string }) => {
      stderr += chunk.toString()
    })

    // Return a promise that resolves when the stream ends
    return new Promise((resolve, reject) => {
      const nodeRes = event.node.res
      let totalBytes = 0

      // Track bytes and enforce max download size
      child.stdout?.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length
        if (totalBytes > MAX_DOWNLOAD_BYTES) {
          console.warn(`[download] Max size exceeded (${totalBytes} bytes). Killing process.`)
          child.kill('SIGTERM')
          releaseDownloadSlot(ip)
          if (!nodeRes.headersSent) {
            reject(createError({
              statusCode: 413,
              message: 'Download exceeds maximum allowed size (2 GB).',
            }))
          } else {
            nodeRes.end()
            resolve(undefined)
          }
          return
        }
      })

      // Pipe yt-dlp stdout → HTTP response (RAM-only, no disk)
      child.stdout?.pipe(nodeRes)

      child.stdout?.on('error', (err: Error) => {
        console.error('[download] stdout error:', err.message)
        child.kill('SIGTERM')
        releaseDownloadSlot(ip)
        reject(createError({ statusCode: 500, message: 'Stream error.' }))
      })

      child.on('close', (code: number | null) => {
        releaseDownloadSlot(ip)
        if (code === 0) {
          nodeRes.end()
          resolve(undefined)
        } else {
          console.error('[download] yt-dlp exited with code', code, stderr)
          if (!nodeRes.headersSent) {
            reject(createError({
              statusCode: 500,
              message: stderr || 'Download failed.',
            }))
          } else {
            nodeRes.end()
            resolve(undefined)
          }
        }
      })

      child.on('error', (err: any) => {
        console.error('[download] process error:', err.message)
        releaseDownloadSlot(ip)
        if (err.code === 'ENOENT') {
          reject(createError({
            statusCode: 500,
            message: 'yt-dlp is not installed on the server.',
          }))
        } else {
          reject(createError({
            statusCode: 500,
            message: 'Failed to start download process.',
          }))
        }
      })

      // If client disconnects, kill the yt-dlp process to free resources
      nodeRes.on('close', () => {
        if (!child.killed) {
          child.kill('SIGTERM')
        }
      })
    })
  } catch (err: any) {
    releaseDownloadSlot(ip)
    console.error('[/api/video/download] error:', err.message)
    throw createError({
      statusCode: 500,
      message: err.message || 'Download failed.',
    })
  }
})

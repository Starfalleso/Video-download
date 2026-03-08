/**
 * yt-dlp wrapper for extracting video info and streaming
 * Uses child_process to invoke yt-dlp CLI (must be installed on the system).
 *
 * Privacy: No data is persisted. Streams go directly to client.
 */
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * Find the yt-dlp binary — checks common locations
 */
function getYtDlpPath(): string {
  return process.env.YTDLP_PATH || 'yt-dlp'
}

export interface VideoFormat {
  id: string
  label: string
  ext: string
  resolution?: string
  filesize?: number
  isAudio?: boolean
}

export interface VideoInfo {
  title: string
  thumbnail?: string
  duration?: string
  formats: VideoFormat[]
  audioFormats: VideoFormat[]
  sizeWarning?: string
}

/**
 * Max download size in bytes (2 GB).
 * Downloads above this are blocked server-side.
 */
export const MAX_DOWNLOAD_BYTES = 2 * 1024 * 1024 * 1024

/**
 * Format bytes into human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Fetch video metadata without downloading
 */
export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const ytdlp = getYtDlpPath()

  const { stdout } = await execFileAsync(ytdlp, [
    '--dump-json',
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    url,
  ], {
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large JSON
  })

  const data = JSON.parse(stdout)

  // Build format lists
  const formats: VideoFormat[] = []
  const audioFormats: VideoFormat[] = []
  const seenVideo = new Set<string>()
  const seenAudio = new Set<string>()

  if (data.formats && Array.isArray(data.formats)) {
    for (const f of data.formats) {
      if (f.vcodec === 'none' && f.acodec === 'none') continue
      if (f.protocol === 'mhtml') continue

      const hasVideo = f.vcodec && f.vcodec !== 'none'
      const hasAudio = f.acodec && f.acodec !== 'none'
      const size = f.filesize || f.filesize_approx
      const sizeLabel = size ? ` ~${formatBytes(size)}` : ''

      // Combined video+audio formats
      if (hasVideo && hasAudio) {
        const resolution = f.resolution || f.format_note || `${f.height || '?'}p`
        const label = `${resolution} (${f.ext})${sizeLabel}`
        if (!seenVideo.has(resolution)) {
          seenVideo.add(resolution)
          formats.push({
            id: f.format_id,
            label,
            ext: f.ext || 'mp4',
            resolution,
            filesize: size,
          })
        }
      }

      // Audio-only formats
      if (!hasVideo && hasAudio) {
        const abr = f.abr ? `${Math.round(f.abr)}kbps` : f.format_note || 'audio'
        const label = `${abr} (${f.ext})${sizeLabel}`
        if (!seenAudio.has(abr)) {
          seenAudio.add(abr)
          audioFormats.push({
            id: f.format_id,
            label,
            ext: f.ext || 'm4a',
            filesize: size,
            isAudio: true,
          })
        }
      }
    }
  }

  // Fallbacks
  if (formats.length === 0) {
    formats.push({ id: 'best', label: 'Best Quality', ext: 'mp4' })
  }
  if (audioFormats.length === 0) {
    audioFormats.push({ id: 'bestaudio', label: 'Best Audio', ext: 'm4a', isAudio: true })
  }

  // Format duration
  let duration: string | undefined
  if (data.duration) {
    const totalSec = Math.round(data.duration)
    const hours = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60
    duration = hours > 0
      ? `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${mins}:${String(secs).padStart(2, '0')}`
  }

  // Check for oversized formats and add a warning
  const ONE_GB = 1024 * 1024 * 1024
  const hasLargeFormat = [...formats, ...audioFormats].some(f => f.filesize && f.filesize > ONE_GB)
  const sizeWarning = hasLargeFormat
    ? 'Some formats exceed 1 GB. Large files may take longer and use more bandwidth.'
    : undefined

  return {
    title: data.title || 'Untitled Video',
    thumbnail: data.thumbnail,
    duration,
    formats: formats.slice(-8),
    audioFormats: audioFormats.slice(-6),
    sizeWarning,
  }
}

/**
 * Stream video to a writable stream.
 * Outputs to stdout (-o -) so no temp files are created on disk.
 *
 * Includes a connection timeout: if no data is received within 30 seconds
 * of starting (or 60 seconds of silence mid-stream), the process is killed.
 */
export function streamVideo(url: string, formatId?: string, audioOnly?: boolean): {
  process: ReturnType<typeof spawn>
  filename: string
  contentType: string
} {
  const ytdlp = getYtDlpPath()

  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--socket-timeout', '30',         // yt-dlp network timeout
    '--retries', '3',                 // yt-dlp built-in retries
  ]

  if (audioOnly) {
    args.push('-f', formatId || 'bestaudio')
    args.push('--extract-audio')
    args.push('--audio-format', 'mp3')
    args.push('-o', '-')
  } else {
    args.push('-f', formatId || 'best[ext=mp4]/best')
    args.push('--merge-output-format', 'mp4')
    args.push('-o', '-')
  }

  args.push(url)

  const child = spawn(ytdlp, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  // ── Idle timeout: kill if no stdout data for 60 seconds ─────────
  let idleTimer: ReturnType<typeof setTimeout> | null = null

  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      console.warn('[streamVideo] Idle timeout — no data for 60s. Killing process.')
      if (!child.killed) child.kill('SIGTERM')
    }, 60_000)
  }

  // Start the initial timer (30s to receive first data)
  idleTimer = setTimeout(() => {
    console.warn('[streamVideo] Connection timeout — no data within 30s. Killing process.')
    if (!child.killed) child.kill('SIGTERM')
  }, 30_000)

  // Reset timer on each data chunk
  child.stdout?.on('data', () => {
    resetIdleTimer()
  })

  // Clear timer when process ends
  child.on('close', () => {
    if (idleTimer) clearTimeout(idleTimer)
  })

  const timestamp = Date.now()
  const ext = audioOnly ? 'mp3' : 'mp4'
  const filename = `video_${timestamp}.${ext}`
  const contentType = audioOnly ? 'audio/mpeg' : 'video/mp4'

  return {
    process: child,
    filename,
    contentType,
  }
}

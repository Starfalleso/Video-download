/**
 * GET /api/health
 *
 * Health check endpoint — returns server status and yt-dlp availability.
 * Useful for monitoring and debugging deployment issues.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export default defineEventHandler(async () => {
  const status: {
    status: string
    timestamp: string
    ytdlp: { installed: boolean; version?: string; error?: string }
    node: string
    uptime: number
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    ytdlp: { installed: false },
    node: process.version,
    uptime: Math.round(process.uptime()),
  }

  // Check yt-dlp availability
  try {
    const ytdlp = process.env.YTDLP_PATH || 'yt-dlp'
    const { stdout } = await execFileAsync(ytdlp, ['--version'], { timeout: 5000 })
    status.ytdlp = {
      installed: true,
      version: stdout.trim(),
    }
  } catch (err: any) {
    status.status = 'degraded'
    status.ytdlp = {
      installed: false,
      error: err.code === 'ENOENT'
        ? 'yt-dlp not found in PATH'
        : err.message,
    }
  }

  return status
})

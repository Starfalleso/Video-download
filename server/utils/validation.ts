/**
 * Shared server-side URL validation utils.
 * Mirrors the client-side logic for server-level enforcement.
 */

interface PlatformPattern {
  name: string
  patterns: RegExp[]
}

const PLATFORMS: PlatformPattern[] = [
  {
    name: 'YouTube',
    patterns: [
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]+/,
    ],
  },
  {
    name: 'TikTok',
    patterns: [
      /^(https?:\/\/)?(www\.|vm\.)?tiktok\.com\/@?[^/]+\/(video\/\d+|photo\/\d+)?/,
      /^(https?:\/\/)?vm\.tiktok\.com\/[a-zA-Z0-9]+/,
    ],
  },
  {
    name: 'Instagram',
    patterns: [
      /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|reels|tv)\/[a-zA-Z0-9_-]+/,
    ],
  },
  {
    name: 'Facebook',
    patterns: [
      /^(https?:\/\/)?(www\.|m\.|web\.)?(facebook\.com|fb\.watch)\/.+/,
    ],
  },
  {
    name: 'Twitter / X',
    patterns: [
      /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/,
    ],
  },
]

export function detectServerPlatform(url: string): string | null {
  const trimmed = url.trim()
  for (const platform of PLATFORMS) {
    for (const pattern of platform.patterns) {
      if (pattern.test(trimmed)) {
        return platform.name
      }
    }
  }
  return null
}

export function isValidServerUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

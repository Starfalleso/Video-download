/**
 * Supported platform definitions and URL validation
 * No data is persisted — everything is volatile (RAM only).
 */

export interface Platform {
  name: string
  icon: string
  color: string
  patterns: RegExp[]
}

export const SUPPORTED_PLATFORMS: Platform[] = [
  {
    name: 'YouTube',
    icon: 'i-simple-icons-youtube',
    color: '#FF0000',
    patterns: [
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]+/,
    ],
  },
  {
    name: 'TikTok',
    icon: 'i-simple-icons-tiktok',
    color: '#00F2EA',
    patterns: [
      /^(https?:\/\/)?(www\.|vm\.)?tiktok\.com\/@?[^/]+\/(video\/\d+|photo\/\d+)?/,
      /^(https?:\/\/)?vm\.tiktok\.com\/[a-zA-Z0-9]+/,
    ],
  },
  {
    name: 'Instagram',
    icon: 'i-simple-icons-instagram',
    color: '#E4405F',
    patterns: [
      /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|reels|tv)\/[a-zA-Z0-9_-]+/,
    ],
  },
  {
    name: 'Facebook',
    icon: 'i-simple-icons-facebook',
    color: '#1877F2',
    patterns: [
      /^(https?:\/\/)?(www\.|m\.|web\.)?(facebook\.com|fb\.watch)\/.+/,
    ],
  },
  {
    name: 'Twitter / X',
    icon: 'i-simple-icons-x',
    color: '#ffffff',
    patterns: [
      /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/,
    ],
  },
]

/**
 * Detect which platform a URL belongs to.
 * Returns the platform name or null if unsupported.
 */
export function detectPlatform(url: string): Platform | null {
  const trimmed = url.trim()
  for (const platform of SUPPORTED_PLATFORMS) {
    for (const pattern of platform.patterns) {
      if (pattern.test(trimmed)) {
        return platform
      }
    }
  }
  return null
}

/**
 * Basic URL format validation
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

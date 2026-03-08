// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vite-pwa/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  // Nitro server config — volatile storage only (RAM)
  nitro: {
    storage: {
      tmp: {
        driver: 'memory'
      }
    }
  },

  // PWA Configuration
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Video Downloader',
      short_name: 'VidDL',
      description: 'Download videos from YouTube, TikTok, Instagram, Facebook, and Twitter/X',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: '/pwa-192x192.svg',
          sizes: '192x192',
          type: 'image/svg+xml'
        },
        {
          src: '/pwa-512x512.svg',
          sizes: '512x512',
          type: 'image/svg+xml'
        },
        {
          src: '/pwa-512x512.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})

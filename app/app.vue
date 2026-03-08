<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Video Downloader'
const description = 'Download videos from YouTube, TikTok, Instagram, Facebook, and Twitter/X. No data stored — everything streams directly to your device.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2">
          <UIcon name="i-lucide-download" class="w-6 h-6 text-primary" />
          <span class="font-bold text-lg">Video Downloader</span>
        </NuxtLink>
      </template>

      <template #right>
        <UButton
          to="https://github.com/Starfalleso/Video-download"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <div class="flex items-center gap-2 text-sm text-muted">
          <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-green-500" />
          <span>Wipe-on-Refresh: No data stored. All files stream directly to your device.</span>
        </div>
      </template>

      <template #right>
        <div class="flex items-center gap-3">
          <NuxtLink
            to="https://github.com/Starfalleso/Video-download"
            target="_blank"
            class="text-sm text-muted hover:text-white transition-colors flex items-center gap-1"
          >
            <UIcon name="i-simple-icons-github" class="w-3.5 h-3.5" />
            Open Source
          </NuxtLink>
          <span class="text-sm text-muted">·</span>
          <p class="text-sm text-muted">
            © {{ new Date().getFullYear() }} Video Downloader
          </p>
        </div>
      </template>
    </UFooter>
  </UApp>
</template>

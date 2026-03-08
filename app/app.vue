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
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} Video Downloader
        </p>
      </template>
    </UFooter>
  </UApp>
</template>

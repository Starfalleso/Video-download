<template>
  <div class="relative">
    <!-- Animated Background Orbs -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float-slow" />
      <div class="absolute top-1/3 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-slower" />
      <div class="absolute -bottom-20 left-1/3 w-72 h-72 bg-pink-500/8 rounded-full blur-3xl animate-float-medium" />
    </div>

    <!-- Hero -->
    <UPageHero
      title="Video Downloader"
      description="Paste a link from YouTube, TikTok, Instagram, Facebook, or Twitter to download videos directly to your device."
    >
      <template #top>
        <!-- Platform Icons -->
        <div class="flex items-center justify-center gap-4 mb-4">
          <div
            v-for="p in SUPPORTED_PLATFORMS"
            :key="p.name"
            class="group relative"
          >
            <div
              class="p-2.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] transition-all duration-200 group-hover:scale-110"
              :class="{ 'ring-2 ring-primary': detectedPlatform?.name === p.name }"
            >
              <UIcon :name="p.icon" class="w-6 h-6" :style="{ color: detectedPlatform?.name === p.name ? p.color : undefined }" />
            </div>
            <span class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {{ p.name }}
            </span>
          </div>
        </div>
      </template>
    </UPageHero>

    <!-- Main Input Section -->
    <UPageSection>
      <UContainer class="max-w-2xl">
        <!-- URL Input Form -->
        <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="handleFetch">
          <div class="flex-1 relative">
            <UInput
              v-model="url"
              placeholder="Paste a video URL here…"
              icon="i-lucide-link"
              size="xl"
              :disabled="loading"
              class="w-full"
              @update:model-value="onInputChange"
            />
            <!-- Clipboard Paste Button -->
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted hover:text-white hover:bg-[var(--ui-bg-elevated)] transition-all"
              title="Paste from clipboard"
              @click="pasteFromClipboard"
            >
              <UIcon name="i-lucide-clipboard-paste" class="w-4 h-4" />
            </button>
          </div>
          <UButton
            type="submit"
            :loading="loading"
            :disabled="!url.trim()"
            size="xl"
            icon="i-lucide-download"
          >
            Fetch
          </UButton>
        </form>

        <!-- Detected Platform Badge -->
        <Transition name="fade">
          <div v-if="detectedPlatform" class="mt-3 flex items-center gap-2">
            <UBadge variant="subtle" size="sm">
              <UIcon :name="detectedPlatform.icon" class="w-3.5 h-3.5 mr-1" :style="{ color: detectedPlatform.color }" />
              {{ detectedPlatform.name }} detected
            </UBadge>
          </div>
        </Transition>

        <!-- Video Info Card -->
        <Transition name="fade">
          <UCard v-if="videoInfo" class="mt-6">
            <div class="flex flex-col sm:flex-row items-start gap-4">
              <!-- Thumbnail / Preview -->
              <div class="w-full sm:w-48 shrink-0">
                <div
                  v-if="videoInfo.thumbnail"
                  class="relative group cursor-pointer rounded-lg overflow-hidden"
                  @click="showPreview = !showPreview"
                >
                  <img
                    :src="videoInfo.thumbnail"
                    :alt="videoInfo.title"
                    class="w-full h-28 object-cover"
                  />
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UIcon :name="showPreview ? 'i-lucide-x' : 'i-lucide-play'" class="w-8 h-8 text-white" />
                  </div>
                </div>
                <!-- Embedded Video Preview -->
                <Transition name="fade">
                  <div v-if="showPreview && embedUrl" class="mt-2">
                    <iframe
                      :src="embedUrl"
                      class="w-full aspect-video rounded-lg"
                      frameborder="0"
                      allow="autoplay; encrypted-media"
                      allowfullscreen
                    />
                  </div>
                </Transition>
              </div>

              <div class="flex-1 min-w-0 w-full">
                <h3 class="font-semibold text-lg truncate">{{ videoInfo.title }}</h3>
                <p v-if="videoInfo.duration" class="text-muted text-sm mt-1">
                  <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 inline mr-1" />
                  {{ videoInfo.duration }}
                </p>
                <p v-if="videoInfo.platform" class="text-muted text-sm mt-0.5">
                  <UIcon name="i-lucide-globe" class="w-3.5 h-3.5 inline mr-1" />
                  {{ videoInfo.platform }}
                </p>

                <!-- Audio/Video Toggle -->
                <div class="mt-3 flex items-center gap-3">
                  <div class="flex items-center gap-2 p-1 bg-[var(--ui-bg-elevated)] rounded-lg border border-[var(--ui-border)]">
                    <button
                      type="button"
                      class="px-3 py-1 text-xs font-medium rounded-md transition-all"
                      :class="!audioOnly ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'"
                      @click="audioOnly = false; selectDefaultFormat()"
                    >
                      <UIcon name="i-lucide-video" class="w-3 h-3 inline mr-1" />
                      Video
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1 text-xs font-medium rounded-md transition-all"
                      :class="audioOnly ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'"
                      @click="audioOnly = true; selectDefaultFormat()"
                    >
                      <UIcon name="i-lucide-music" class="w-3 h-3 inline mr-1" />
                      Audio (MP3)
                    </button>
                  </div>
                </div>

                <!-- Format Selector -->
                <div class="mt-3 flex flex-wrap gap-2">
                  <UButton
                    v-for="fmt in activeFormats"
                    :key="fmt.id"
                    size="sm"
                    :variant="selectedFormat === fmt.id ? 'solid' : 'outline'"
                    :color="selectedFormat === fmt.id ? 'primary' : 'neutral'"
                    @click="selectedFormat = fmt.id"
                  >
                    {{ fmt.label }}
                  </UButton>
                </div>

                <!-- Download Button -->
                <UButton
                  class="mt-4"
                  color="success"
                  size="lg"
                  :icon="audioOnly ? 'i-lucide-music' : 'i-lucide-download'"
                  :loading="downloading"
                  :disabled="downloading"
                  @click="handleDownload"
                >
                  {{ downloading ? 'Downloading…' : audioOnly ? 'Download Audio' : 'Download Video' }}
                </UButton>
              </div>
            </div>

            <!-- Progress Bar -->
            <Transition name="fade">
              <div v-if="downloading" class="mt-4">
                <UProgress animation="carousel" />
                <p class="text-muted text-xs mt-2">Streaming to your browser…</p>
              </div>
            </Transition>
          </UCard>
        </Transition>

        <!-- Download History (session only) -->
        <Transition name="fade">
          <UCard v-if="history.length > 0" class="mt-6">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-history" class="w-4 h-4 text-muted" />
                  <span class="font-semibold text-sm">Session History</span>
                  <UBadge variant="subtle" size="xs" color="neutral">
                    {{ history.length }}
                  </UBadge>
                </div>
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-lucide-trash-2"
                  @click="history = []"
                >
                  Clear
                </UButton>
              </div>
            </template>

            <div class="space-y-3">
              <div
                v-for="(item, idx) in history"
                :key="idx"
                class="flex items-center gap-3 p-2 rounded-lg bg-[var(--ui-bg-elevated)]/50"
              >
                <img
                  v-if="item.thumbnail"
                  :src="item.thumbnail"
                  :alt="item.title"
                  class="w-16 h-10 object-cover rounded shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ item.title }}</p>
                  <p class="text-xs text-muted">
                    {{ item.platform }} · {{ item.type }} · {{ item.time }}
                  </p>
                </div>
                <UBadge variant="subtle" color="success" size="xs">
                  <UIcon name="i-lucide-check" class="w-3 h-3 mr-0.5" /> Done
                </UBadge>
              </div>
            </div>

            <template #footer>
              <p class="text-xs text-muted flex items-center gap-1.5">
                <UIcon name="i-lucide-info" class="w-3 h-3" />
                History is stored in memory only — refreshing the page wipes it.
              </p>
            </template>
          </UCard>
        </Transition>
      </UContainer>
    </UPageSection>

    <!-- Ko-fi Support Modal -->
    <UModal v-model:open="showKofi">
      <template #content>
        <div class="p-6 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
            <UIcon name="i-lucide-heart" class="w-7 h-7 text-pink-500" />
          </div>
          <h3 class="text-xl font-bold mb-2">Enjoy the download? ☕</h3>
          <p class="text-muted text-sm mb-6">
            This tool is free and stores zero data. If it saved you time, consider buying me a coffee to keep it running!
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <UButton
              to="https://ko-fi.com/vag3d"
              target="_blank"
              size="lg"
              color="neutral"
              variant="solid"
              icon="i-simple-icons-kofi"
              class="!bg-[#FF5E5B] !hover:bg-[#e04e4b] !text-white !border-none"
            >
              Support on Ko-fi
            </UButton>
            <UButton
              size="lg"
              color="neutral"
              variant="outline"
              @click="showKofi = false"
            >
              Maybe later
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { SUPPORTED_PLATFORMS, detectPlatform, isValidUrl } from '~/utils/platforms'

const toast = useToast()

const url = ref('')
const loading = ref(false)
const downloading = ref(false)
const errorMsg = ref('')
const detectedPlatform = ref<ReturnType<typeof detectPlatform>>(null)
const videoInfo = ref<{
  title: string
  thumbnail?: string
  duration?: string
  platform?: string
  expandedUrl?: string
  formats: { id: string; label: string; filesize?: number }[]
  audioFormats: { id: string; label: string; filesize?: number; isAudio?: boolean }[]
} | null>(null)
const selectedFormat = ref('')
const showKofi = ref(false)
const audioOnly = ref(false)
const showPreview = ref(false)

// Session download history — volatile, wiped on refresh
const history = ref<{
  title: string
  thumbnail?: string
  platform: string
  type: string
  time: string
}[]>([])

// Computed: which format list to show
const activeFormats = computed(() => {
  if (!videoInfo.value) return []
  return audioOnly.value ? videoInfo.value.audioFormats : videoInfo.value.formats
})

// Computed: embed URL for preview
const embedUrl = computed(() => {
  if (!videoInfo.value?.expandedUrl) return null
  const videoUrl = videoInfo.value.expandedUrl

  // YouTube embed
  const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`

  // For other platforms, embedding is restricted — return null
  return null
})

function selectDefaultFormat() {
  const formats = activeFormats.value
  if (formats.length) {
    selectedFormat.value = formats[0].id
  }
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      url.value = text.trim()
      onInputChange()
      toast.add({ title: 'Pasted from clipboard', icon: 'i-lucide-clipboard-check', color: 'success' })
    }
  } catch {
    toast.add({ title: 'Could not access clipboard', description: 'Please paste manually with Ctrl+V', icon: 'i-lucide-clipboard-x', color: 'error' })
  }
}

function onInputChange() {
  errorMsg.value = ''
  videoInfo.value = null
  showPreview.value = false
  if (url.value.trim()) {
    detectedPlatform.value = detectPlatform(url.value)
  } else {
    detectedPlatform.value = null
  }
}

async function handleFetch() {
  errorMsg.value = ''
  videoInfo.value = null
  showPreview.value = false

  const trimmed = url.value.trim()

  if (!trimmed) {
    toast.add({ title: 'Please enter a video URL', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }

  if (!isValidUrl(trimmed)) {
    toast.add({ title: 'Invalid URL', description: 'Please enter a valid URL starting with http:// or https://', icon: 'i-lucide-triangle-alert', color: 'error' })
    return
  }

  const platform = detectPlatform(trimmed)
  if (!platform) {
    toast.add({ title: 'Unsupported platform', description: 'We support YouTube, TikTok, Instagram, Facebook, and Twitter/X.', icon: 'i-lucide-ban', color: 'error' })
    return
  }

  detectedPlatform.value = platform
  loading.value = true

  try {
    const data = await $fetch('/api/video/info', {
      method: 'POST',
      body: { url: trimmed },
    })

    videoInfo.value = data as any
    audioOnly.value = false
    selectDefaultFormat()

    toast.add({ title: 'Video found!', description: (data as any)?.title, icon: 'i-lucide-check-circle-2', color: 'success' })
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Failed to fetch video info.'
    toast.add({ title: 'Fetch failed', description: msg, icon: 'i-lucide-triangle-alert', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function handleDownload() {
  if (!videoInfo.value) return

  downloading.value = true

  try {
    const response = await $fetch.raw('/api/video/download', {
      method: 'POST',
      body: {
        url: videoInfo.value.expandedUrl || url.value.trim(),
        formatId: selectedFormat.value,
        audioOnly: audioOnly.value,
      },
      responseType: 'blob',
    })

    const blob = response._data as Blob

    const disposition = response.headers.get('content-disposition')
    let filename = audioOnly.value ? 'audio.mp3' : 'video.mp4'
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)"?/i)
      if (match) {
        filename = decodeURIComponent(match[1])
      }
    }

    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl)
      a.remove()
    }, 1000)

    // Add to session history
    history.value.unshift({
      title: videoInfo.value!.title,
      thumbnail: videoInfo.value!.thumbnail,
      platform: videoInfo.value!.platform || detectedPlatform.value?.name || 'Unknown',
      type: audioOnly.value ? 'Audio (MP3)' : 'Video (MP4)',
      time: new Date().toLocaleTimeString(),
    })

    toast.add({ title: 'Download started!', description: 'Check your downloads folder.', icon: 'i-lucide-download', color: 'success' })

    // Show Ko-fi popup after download
    setTimeout(() => {
      showKofi.value = true
    }, 2000)
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Download failed.'
    toast.add({ title: 'Download failed', description: msg, icon: 'i-lucide-triangle-alert', color: 'error' })
  } finally {
    downloading.value = false
  }
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes float-slow {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}
@keyframes float-slower {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-40px, 20px) scale(1.08); }
  66% { transform: translate(25px, -35px) scale(0.92); }
}
@keyframes float-medium {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(35px, -25px) scale(1.03); }
}

.animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
.animate-float-slower { animation: float-slower 25s ease-in-out infinite; }
.animate-float-medium { animation: float-medium 18s ease-in-out infinite; }
</style>

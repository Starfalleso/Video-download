# 📥 Video Downloader

A fast, privacy-first multi-platform video downloader built with **Nuxt 4** and **Nuxt UI v4**.

[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&labelColor=020420)](https://tailwindcss.com)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?logo=ko-fi&labelColor=020420)](https://ko-fi.com/vag3d)

---

## ✨ Features

- **Multi-platform** — YouTube, TikTok, Instagram, Facebook, Twitter/X
- **Video & Audio** — Download as MP4 or extract MP3 audio-only
- **Format selector** — Choose quality with file size estimates
- **Stream to device** — Files go straight to your browser, nothing saved on the server
- **Clipboard paste** — One-click paste from clipboard
- **URL shortener expansion** — Auto-expands bit.ly, t.co, vm.tiktok.com, fb.watch, etc.
- **YouTube preview** — Click thumbnail to embed a preview player
- **Session history** — In-memory download log, wiped on refresh
- **Toast notifications** — Clean feedback for every action
- **Animated background** — Floating gradient orbs
- **Dark / Light mode** — Automatic or manual toggle
- **Rate limiting** — 15 info requests / 5 downloads per minute per IP
- **PWA ready** — Installable as a standalone app
- **Ko-fi support popup** — Shows after each download to support the developer

---

## 🔒 Privacy

> **Wipe-on-Refresh policy** — No database, no file storage, no cookies.
> All downloads are streamed directly from `yt-dlp` stdout → HTTP response → your browser.
> Session history and rate-limit state live in RAM and are wiped when the server restarts.

---

## 🛠 Requirements

- **Node.js** 18+
- **[yt-dlp](https://github.com/yt-dlp/yt-dlp#installation)** installed and available in `PATH`
  ```bash
  # Windows (winget)
  winget install yt-dlp

  # macOS / Linux
  brew install yt-dlp
  # or
  pip install yt-dlp
  ```

---

## 🚀 Getting Started

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
# → http://localhost:3000
```

### Build for production

```bash
npm run build
npm run preview
```

---

## ⚙️ Configuration

| Environment Variable | Default   | Description                        |
|----------------------|-----------|------------------------------------|
| `YTDLP_PATH`         | `yt-dlp`  | Custom path to the yt-dlp binary   |

---

## ☕ Support

If this tool saved you time, consider buying me a coffee!

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/vag3d)

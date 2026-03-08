# 📥 Video Downloader

A fast, privacy-first multi-platform video downloader built with **Nuxt 4** and **Nuxt UI v4**.

[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen?logo=github&labelColor=020420)](https://github.com/Starfalleso/Video-download)
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

## � Open Source & Safety

This project is **100% open source**. Every line of code is publicly available — you can inspect, audit, fork, or self-host it yourself.

🔗 **Source code:** [github.com/Starfalleso/Video-download](https://github.com/Starfalleso/Video-download)

> **Wipe-on-Refresh policy** — No database, no file storage, no cookies, no tracking.
> All downloads are streamed directly from `yt-dlp` stdout → HTTP response → your browser.
> Session history and rate-limit state live in RAM and are wiped when the server restarts.
> Don't take our word for it — read the code yourself.

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

### Configure environment (optional)

```bash
cp .env.example .env
# Edit .env if yt-dlp is not in your PATH
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

## 🐳 Docker (Self-hosting)

The easiest way to self-host. Docker handles Node.js, yt-dlp, and ffmpeg automatically.

### Quick start

```bash
docker compose up -d
# → http://localhost:3000
```

### Build manually

```bash
docker build -t video-downloader .
docker run -p 3000:3000 video-downloader
```

> **Note:** No volumes are mounted — all download data is streamed through RAM and never written to disk.

---

## ⚙️ Configuration

| Environment Variable | Default    | Description                              |
|----------------------|------------|------------------------------------------|
| `YTDLP_PATH`         | `yt-dlp`   | Custom path to the yt-dlp binary         |
| `NITRO_PORT`         | `3000`     | Port the server listens on               |
| `NITRO_HOST`         | `0.0.0.0`  | Host binding (use `0.0.0.0` for Docker)  |
| `NODE_ENV`           | (dev mode) | Set to `production` for prod deployments |

Copy `.env.example` to `.env` to override any of these locally.

---

## ☕ Support

If this tool saved you time, consider buying me a coffee!

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/vag3d)

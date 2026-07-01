# StreamPlus

A streaming website with two parts:

- **Watch** (`/`) — paste a link from YouTube, Vimeo, Twitch, or a direct MP4/HLS file and play it in an embedded universal player.
- **Reels** (`/reels`) — an Instagram/TikTok-style vertical feed: swipe on mobile, scroll or use arrow keys on desktop, autoplay-on-view, mute toggle, like/comment/share actions.

Fully responsive — works on desktop (mouse wheel/keyboard) and mobile (touch swipe).

## Stack

Next.js (App Router) + React + TypeScript + Tailwind CSS + [react-player](https://github.com/CookPete/react-player) for universal embeds.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Notes

- The reels feed and "Trending" row currently use small placeholder clips in `public/videos` / `public/posters` — swap `src/lib/mock-data.ts` for real content or wire it up to a backend/CDN.
- The "Download this file" link on the Watch page only appears for direct media file URLs (`.mp4`, `.webm`, etc.) you control — it does not extract or rip video from platforms like YouTube/Instagram/TikTok, since that would violate their Terms of Service.

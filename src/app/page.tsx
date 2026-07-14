"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TRENDING, REELS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { VideoCard } from "@/components/VideoCard";
import { Shelf } from "@/components/Shelf";
import { PlaylistSheet } from "@/components/PlaylistSheet";
import {
  LinkIcon,
  DownloadIcon,
  PlayIcon,
  PlusIcon,
  BookmarkIcon,
  PlaylistIcon,
} from "@/components/icons";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

const DIRECT_FILE_RE = /\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i;

type Upload = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  src: string;
};

function WatchInner() {
  const params = useSearchParams();
  const { user } = useAuth();
  const initialV = params.get("v");

  const [urlInput, setUrlInput] = useState("");
  const [activeUrl, setActiveUrl] = useState<string>(initialV || TRENDING[0].src);
  const [activeTitle, setActiveTitle] = useState<string>(
    initialV ? "Your video" : TRENDING[0].title
  );
  const [error, setError] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [saved, setSaved] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/uploads")
      .then((r) => r.json())
      .then((d) => alive && setUploads(d.uploads ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Record watch history and load saved state for the active video.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: activeUrl, title: activeTitle, src: activeUrl }),
    }).catch(() => {});
    fetch(`/api/saved?videoId=${encodeURIComponent(activeUrl)}`)
      .then((r) => r.json())
      .then((d) => alive && setSaved(Boolean(d.saved)))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeUrl]);

  function play(url: string, title: string) {
    setActiveUrl(url);
    setActiveTitle(title);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function toggleSave() {
    if (!user) return;
    setSaved((s) => !s);
    try {
      const r = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: activeUrl, title: activeTitle, src: activeUrl }),
      });
      const d = await r.json();
      if (typeof d.saved === "boolean") setSaved(d.saved);
    } catch {
      setSaved((s) => !s);
    }
  }

  function handleLoad(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      setError("Please paste a valid video URL.");
      return;
    }
    setError("");
    play(trimmed, "Pasted link");
  }

  const canDownload = DIRECT_FILE_RE.test(activeUrl);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-5 sm:py-8 flex flex-col gap-9">
      {/* Paste-link bar */}
      <form onSubmit={handleLoad} className="flex flex-col gap-2">
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <LinkIcon
              width={18}
              height={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste any video link — YouTube, Vimeo, Twitch, MP4…"
              className="w-full rounded-full bg-white/5 border border-white/10 pl-12 pr-4 py-3.5 text-sm outline-none transition-colors focus:border-fuchsia-500/60 focus:bg-white/[0.07] placeholder:text-white/40"
            />
          </div>
          <button
            type="submit"
            className="btn-grad flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white"
          >
            <PlayIcon width={16} height={16} />
            <span className="hidden sm:inline">Play</span>
          </button>
        </div>
        {error && <p className="text-red-400 text-sm px-2">{error}</p>}
      </form>

      {/* Featured player */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-r from-violet-600/30 via-fuchsia-600/20 to-indigo-600/30 blur-3xl" />
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl shadow-black/60">
            <ReactPlayer
              key={activeUrl}
              src={activeUrl}
              playing
              controls
              width="100%"
              height="100%"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 px-1">
          <p className="text-base font-semibold line-clamp-1">{activeTitle}</p>
          <div className="flex shrink-0 items-center gap-2">
            {user && (
              <>
                <button
                  onClick={toggleSave}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                    saved
                      ? "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <BookmarkIcon width={15} height={15} filled={saved} />
                  {saved ? "Saved" : "Save"}
                </button>
                <button
                  onClick={() => setPlaylistOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <PlaylistIcon width={15} height={15} />
                  <span className="hidden sm:inline">Playlist</span>
                </button>
              </>
            )}
            {canDownload && (
              <a
                href={activeUrl}
                download
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <DownloadIcon width={15} height={15} />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Latest uploads shelf */}
      <Shelf
        title="Latest uploads"
        action={{ label: "Upload +", href: user ? "/upload" : "/login?next=/upload" }}
      >
        {uploads.length === 0 ? (
          <Link
            href={user ? "/upload" : "/login?next=/upload"}
            className="flex w-72 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] aspect-video text-center text-sm text-white/45 hover:bg-white/5 transition-colors"
          >
            <PlusIcon width={22} height={22} />
            Upload the first video
          </Link>
        ) : (
          uploads.map((item) => (
            <div key={item.id} className="w-64 shrink-0">
              <VideoCard
                title={item.title}
                subtitle={item.ownerName}
                videoSrc={item.src}
                active={item.src === activeUrl}
                onClick={() => play(item.src, item.title)}
              />
            </div>
          ))
        )}
      </Shelf>

      {/* Trending shelf */}
      <Shelf title="Trending now">
        {TRENDING.map((item) => (
          <div key={item.id} className="w-64 shrink-0">
            <VideoCard
              title={item.title}
              subtitle={item.channel}
              poster={item.thumbnail}
              active={item.src === activeUrl}
              onClick={() => play(item.src, item.title)}
            />
          </div>
        ))}
      </Shelf>

      {/* Reels shelf */}
      <Shelf title="Reels" action={{ label: "Open reels", href: "/reels" }}>
        {REELS.map((r) => (
          <div key={r.id} className="w-40 shrink-0">
            <VideoCard
              title={r.caption}
              href={`/reels?reel=${r.id}`}
              poster={r.poster}
              aspect="portrait"
            />
          </div>
        ))}
      </Shelf>

      <PlaylistSheet
        open={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        video={{ videoId: activeUrl, title: activeTitle, src: activeUrl }}
      />
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-sm text-white/40">
          Loading…
        </div>
      }
    >
      <WatchInner />
    </Suspense>
  );
}

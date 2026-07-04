"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TRENDING } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { LinkIcon, DownloadIcon, PlayIcon, PlusIcon } from "@/components/icons";

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

  function play(url: string, title: string) {
    setActiveUrl(url);
    setActiveTitle(title);
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
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-8">
      {/* Link input */}
      <form onSubmit={handleLoad} className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <LinkIcon
              width={18}
              height={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a video link — YouTube, Vimeo, Twitch, MP4…"
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-sm outline-none transition-colors focus:border-violet-500 focus:bg-white/[0.07] placeholder:text-white/40"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] transition px-6 py-3.5 text-sm font-semibold"
          >
            <PlayIcon width={16} height={16} />
            Play
          </button>
        </div>
        {error && <p className="text-red-400 text-sm px-1">{error}</p>}
      </form>

      {/* Player */}
      <div className="flex flex-col gap-3">
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/50">
          <ReactPlayer
            key={activeUrl}
            src={activeUrl}
            playing
            controls
            width="100%"
            height="100%"
          />
        </div>
        <div className="flex items-center justify-between gap-4 px-1">
          <p className="text-sm font-medium text-white/80 line-clamp-1">
            {activeTitle}
          </p>
          {canDownload && (
            <a
              href={activeUrl}
              download
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <DownloadIcon width={15} height={15} />
              Download
            </a>
          )}
        </div>
      </div>

      {/* Latest uploads */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white/90">
            Latest uploads
          </h2>
          <Link
            href={user ? "/upload" : "/login?next=/upload"}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <PlusIcon width={15} height={15} />
            Upload
          </Link>
        </div>
        {uploads.length === 0 ? (
          <p className="text-sm text-white/40 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-8 text-center">
            No uploads yet.{" "}
            <Link
              href={user ? "/upload" : "/login?next=/upload"}
              className="text-violet-400 hover:text-violet-300"
            >
              Be the first →
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-5">
            {uploads.map((item) => {
              const active = item.src === activeUrl;
              return (
                <button
                  key={item.id}
                  onClick={() => play(item.src, item.title)}
                  className="text-left group focus:outline-none"
                >
                  <div
                    className={`relative aspect-video rounded-xl overflow-hidden bg-black border mb-2 transition-colors ${
                      active
                        ? "border-violet-500"
                        : "border-white/10 group-hover:border-white/25"
                    }`}
                  >
                    <video
                      src={item.src}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black scale-90 group-hover:scale-100 transition-transform">
                        <PlayIcon width={18} height={18} className="translate-x-0.5" />
                      </span>
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-1 text-white/90">
                    {item.title}
                  </p>
                  <Link
                    href={`/u/${item.ownerId}`}
                    className="text-xs text-white/40 mt-0.5 hover:text-white/70"
                  >
                    {item.ownerName}
                  </Link>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Trending */}
      <section>
        <h2 className="text-base font-semibold mb-4 text-white/90">Trending</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-5">
          {TRENDING.map((item) => {
            const active = item.src === activeUrl;
            return (
              <button
                key={item.id}
                onClick={() => play(item.src, item.title)}
                className="text-left group focus:outline-none"
              >
                <div
                  className={`relative aspect-video rounded-xl overflow-hidden bg-white/5 border mb-2 transition-colors ${
                    active
                      ? "border-violet-500"
                      : "border-white/10 group-hover:border-white/25"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/0 group-hover:bg-white/90 group-hover:text-black transition-all scale-75 group-hover:scale-100">
                      <PlayIcon width={18} height={18} className="translate-x-0.5" />
                    </span>
                  </span>
                </div>
                <p className="text-sm font-medium line-clamp-1 text-white/90">
                  {item.title}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{item.channel}</p>
              </button>
            );
          })}
        </div>
      </section>
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

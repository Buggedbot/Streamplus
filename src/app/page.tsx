"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { TRENDING } from "@/lib/mock-data";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

const DIRECT_FILE_RE = /\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i;

export default function WatchPage() {
  const [urlInput, setUrlInput] = useState("");
  const [activeUrl, setActiveUrl] = useState<string>(TRENDING[0].src);
  const [error, setError] = useState("");

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
    setActiveUrl(trimmed);
  }

  const canDownload = DIRECT_FILE_RE.test(activeUrl);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      <form onSubmit={handleLoad} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste a video link (YouTube, Vimeo, Twitch, direct MP4/HLS...)"
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-violet-500 placeholder:text-white/40"
        />
        <button
          type="submit"
          className="rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors px-6 py-3 text-sm font-semibold"
        >
          Play
        </button>
      </form>
      {error && <p className="text-red-400 text-sm -mt-3">{error}</p>}

      <div className="w-full aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10">
        <ReactPlayer
          key={activeUrl}
          src={activeUrl}
          playing
          controls
          width="100%"
          height="100%"
        />
      </div>

      {canDownload && (
        <a
          href={activeUrl}
          download
          className="self-start text-sm text-violet-400 hover:text-violet-300 underline underline-offset-4"
        >
          Download this file
        </a>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Trending</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {TRENDING.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveUrl(item.src)}
              className="text-left group"
            >
              <div className="aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="text-xs font-medium line-clamp-1">{item.title}</p>
              <p className="text-xs text-white/40">{item.channel}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

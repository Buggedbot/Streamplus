"use client";

import { useEffect, useRef, useState } from "react";
import type { Reel } from "@/lib/mock-data";

export default function ReelCard({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          video.play().catch(() => {});
          setPaused(false);
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full snap-start snap-stop-always shrink-0 flex items-center justify-center bg-black"
    >
      <video
        ref={videoRef}
        src={reel.src}
        poster={reel.poster}
        loop
        muted={muted}
        playsInline
        className="h-full w-full max-w-md mx-auto object-cover sm:rounded-xl"
        onClick={togglePlay}
      />

      {paused && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <span className="text-5xl drop-shadow-lg">▶</span>
        </button>
      )}

      {/* Mute toggle */}
      <button
        onClick={() => setMuted((m) => !m)}
        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/50 flex items-center justify-center text-white text-sm"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Right-side action rail */}
      <div className="absolute right-3 bottom-24 sm:bottom-8 flex flex-col items-center gap-5 text-white">
        <button
          onClick={() => setLiked((l) => !l)}
          className="flex flex-col items-center gap-1"
        >
          <span className={`text-2xl ${liked ? "text-red-500" : ""}`}>
            {liked ? "♥" : "♡"}
          </span>
          <span className="text-xs">{reel.likes + (liked ? 1 : 0)}</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <span className="text-2xl">💬</span>
          <span className="text-xs">{reel.comments}</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <span className="text-2xl">↗</span>
          <span className="text-xs">Share</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-4 bottom-24 sm:bottom-8 right-20 text-white">
        <p className="font-semibold text-sm">{reel.username}</p>
        <p className="text-sm text-white/80 line-clamp-2">{reel.caption}</p>
      </div>
    </div>
  );
}

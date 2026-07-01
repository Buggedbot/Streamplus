"use client";

import { useEffect, useRef, useState } from "react";
import type { Reel } from "@/lib/mock-data";
import {
  PlayIcon,
  HeartIcon,
  CommentIcon,
  ShareIcon,
  MutedIcon,
  SoundIcon,
} from "@/components/icons";

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

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
      <div className="relative h-full w-full max-w-md mx-auto sm:rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          src={reel.src}
          poster={reel.poster}
          loop
          muted={muted}
          playsInline
          className="h-full w-full object-cover"
          onClick={togglePlay}
        />

        {/* Readability scrim so captions stay legible over bright video */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Center play button when paused */}
        {paused && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
            aria-label="Play"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white transition-transform active:scale-90">
              <PlayIcon width={30} height={30} className="translate-x-0.5" />
            </span>
          </button>
        )}

        {/* Mute toggle */}
        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-transform active:scale-90"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <MutedIcon width={20} height={20} />
          ) : (
            <SoundIcon width={20} height={20} />
          )}
        </button>

        {/* Right-side action rail */}
        <div className="absolute right-3 bottom-24 sm:bottom-6 flex flex-col items-center gap-6 text-white">
          <button
            onClick={() => setLiked((l) => !l)}
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-90"
            aria-pressed={liked}
            aria-label="Like"
          >
            <HeartIcon
              width={30}
              height={30}
              filled={liked}
              className={liked ? "text-red-500" : "text-white"}
            />
            <span className="text-xs font-medium">
              {formatCount(reel.likes + (liked ? 1 : 0))}
            </span>
          </button>
          <button
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-90"
            aria-label="Comments"
          >
            <CommentIcon width={30} height={30} />
            <span className="text-xs font-medium">
              {formatCount(reel.comments)}
            </span>
          </button>
          <button
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-90"
            aria-label="Share"
          >
            <ShareIcon width={28} height={28} />
            <span className="text-xs font-medium">Share</span>
          </button>
        </div>

        {/* Bottom info */}
        <div className="absolute left-4 bottom-24 sm:bottom-6 right-20 text-white">
          <p className="font-semibold text-sm">{reel.username}</p>
          <p className="mt-1 text-sm text-white/85 line-clamp-2">
            {reel.caption}
          </p>
        </div>
      </div>
    </div>
  );
}

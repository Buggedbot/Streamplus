"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Reel } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { CommentsSheet, type Comment } from "@/components/CommentsSheet";
import { ReportSheet } from "@/components/ReportSheet";
import {
  PlayIcon,
  HeartIcon,
  CommentIcon,
  ShareIcon,
  MutedIcon,
  SoundIcon,
  CheckIcon,
  FlagIcon,
} from "@/components/icons";

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function ReelCard({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);
  const router = useRouter();
  const { user } = useAuth();

  const videoId = `reel:${reel.id}`;

  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeExtra, setLikeExtra] = useState(0); // real likes on top of the seed
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsExtra, setCommentsExtra] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  // Load real like state + comments for this reel.
  useEffect(() => {
    let alive = true;
    fetch(`/api/like?videoId=${encodeURIComponent(videoId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setLiked(Boolean(d.liked));
          setLikeExtra(d.count || 0);
        }
      })
      .catch(() => {});
    fetch(`/api/comments?videoId=${encodeURIComponent(videoId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setComments(d.comments || []);
          setCommentsExtra((d.comments || []).length);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [videoId]);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          video.play().catch(() => {});
          setPaused(false);
          // Count a view the first time this reel becomes active.
          if (!viewedRef.current) {
            viewedRef.current = true;
            fetch("/api/view", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videoId }),
            }).catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [videoId]);

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

  async function toggleLike() {
    if (!user) {
      router.push("/login?next=/reels");
      return;
    }
    // Optimistic
    setLiked((v) => !v);
    setLikeExtra((n) => n + (liked ? -1 : 1));
    try {
      const r = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      const d = await r.json();
      if (typeof d.count === "number") {
        setLiked(Boolean(d.liked));
        setLikeExtra(d.count);
      }
    } catch {
      // revert on failure
      setLiked((v) => !v);
    }
  }

  async function postComment(text: string) {
    if (!user) {
      router.push("/login?next=/reels");
      return;
    }
    try {
      const r = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, text }),
      });
      const d = await r.json();
      if (d.comment) {
        setComments((c) => [...c, d.comment]);
        setCommentsExtra((n) => n + 1);
      }
    } catch {
      // ignore
    }
  }

  function openReport() {
    if (!user) {
      router.push("/login?next=/reels");
      return;
    }
    setReportOpen(true);
  }

  async function submitReport(reason: string) {
    setReportOpen(false);
    setReported(true);
    setTimeout(() => setReported(false), 2200);
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, reason, caption: reel.caption }),
      });
    } catch {
      // ignore
    }
  }

  async function share() {
    const url = `${window.location.origin}/reels?reel=${reel.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: reel.caption, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      }
    } catch {
      // user cancelled share; ignore
    }
  }

  const likeCount = reel.likes + likeExtra;
  const commentCount = reel.comments + commentsExtra;

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
            onClick={toggleLike}
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
            <span className="text-xs font-medium">{formatCount(likeCount)}</span>
          </button>
          <button
            onClick={() => setCommentsOpen(true)}
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-90"
            aria-label="Comments"
          >
            <CommentIcon width={30} height={30} />
            <span className="text-xs font-medium">
              {formatCount(commentCount)}
            </span>
          </button>
          <button
            onClick={share}
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-90"
            aria-label="Share"
          >
            {shared ? (
              <CheckIcon width={28} height={28} className="text-emerald-400" />
            ) : (
              <ShareIcon width={28} height={28} />
            )}
            <span className="text-xs font-medium">
              {shared ? "Copied" : "Share"}
            </span>
          </button>
          <button
            onClick={openReport}
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-90 text-white/80"
            aria-label="Report"
          >
            {reported ? (
              <CheckIcon width={26} height={26} className="text-emerald-400" />
            ) : (
              <FlagIcon width={26} height={26} />
            )}
            <span className="text-xs font-medium">
              {reported ? "Sent" : "Report"}
            </span>
          </button>
        </div>

        {/* Bottom info */}
        <div className="absolute left-4 bottom-24 sm:bottom-6 right-20 text-white">
          <p className="font-semibold text-sm">{reel.username}</p>
          <p className="mt-1 text-sm text-white/85 line-clamp-2">
            {reel.caption}
          </p>
        </div>

        <CommentsSheet
          open={commentsOpen}
          comments={comments}
          onClose={() => setCommentsOpen(false)}
          onPost={postComment}
        />
        <ReportSheet
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          onPick={submitReport}
        />
      </div>
    </div>
  );
}

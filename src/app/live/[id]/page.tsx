"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "@/lib/useSocket";
import { useLive } from "@/lib/useLive";
import { useAuth } from "@/lib/auth";
import {
  LiveIcon,
  EyeIcon,
  CameraIcon,
  ScreenShareIcon,
  PhoneOffIcon,
  CopyIcon,
  CheckIcon,
} from "@/components/icons";

function StreamVideo({ stream, muted }: { stream: MediaStream | null; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      controls={!muted}
      className="h-full w-full object-contain bg-black"
    />
  );
}

function LiveRoomInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const id = params.id;
  const role: "host" | "viewer" = search.get("host") === "1" ? "host" : "viewer";
  const [guestName] = useState(() => `Guest-${Math.random().toString(36).slice(2, 6)}`);
  const name = user?.name || guestName;

  const { socket: socketRef, connected } = useSocket();
  const { localStream, remoteStream, live, ended, viewers, info, notice, goLive, stopLive } =
    useLive(socketRef, connected, { id, role, name });

  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    try {
      const link = `${window.location.origin}/live/${id}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function end() {
    stopLive();
    router.push("/live");
  }

  // ---- Host, not yet broadcasting: setup panel ----
  if (role === "host" && !live) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 text-fuchsia-300">
            <LiveIcon width={20} height={20} />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Start broadcasting
            </span>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your stream a title…"
            className="mt-4 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => goLive("camera", title.trim() || "Live stream")}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] py-6 hover:bg-white/5 transition-colors"
            >
              <CameraIcon width={26} height={26} className="text-fuchsia-300" />
              <span className="text-sm font-medium">Camera</span>
            </button>
            <button
              onClick={() => goLive("screen", title.trim() || "Live stream")}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] py-6 hover:bg-white/5 transition-colors"
            >
              <ScreenShareIcon width={26} height={26} className="text-fuchsia-300" />
              <span className="text-sm font-medium">Screen</span>
            </button>
          </div>
          {notice && <p className="mt-3 text-xs text-amber-300">{notice}</p>}
          <p className="mt-4 text-xs text-white/40">
            Viewers join with your invite link and watch in real time over WebRTC.
          </p>
        </div>
      </div>
    );
  }

  // ---- Viewer: stream ended ----
  if (role === "viewer" && ended) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <LiveIcon width={36} height={36} className="text-white/25" />
        <p className="text-lg font-semibold">This stream has ended</p>
        <button
          onClick={() => router.push("/live")}
          className="rounded-full bg-white/10 hover:bg-white/15 px-5 py-2 text-sm font-semibold transition-colors"
        >
          Back to live
        </button>
      </div>
    );
  }

  const activeStream = role === "host" ? localStream : remoteStream;
  const heading = role === "host" ? title || "You're live" : info?.title || "Live stream";
  const subheading = role === "host" ? "You're broadcasting" : info?.hostName || "";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{heading}</p>
          <p className="text-xs text-white/45 truncate">{subheading}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1.5 text-[11px] font-bold uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Live
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
            <EyeIcon width={14} height={14} />
            {viewers}
          </span>
        </div>
      </div>

      <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black ring-1 ring-white/10">
        {activeStream ? (
          <StreamVideo stream={activeStream} muted={role === "host"} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/40">
            <span className="h-8 w-8 rounded-full border-2 border-white/20 border-t-fuchsia-500 animate-spin" />
            <p className="text-sm">
              {role === "viewer" ? "Connecting to the broadcaster…" : "Starting…"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={copyInvite}
          className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium hover:bg-white/5 transition-colors"
        >
          {copied ? (
            <>
              <CheckIcon width={16} height={16} className="text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <CopyIcon width={16} height={16} /> Invite viewers
            </>
          )}
        </button>
        {role === "host" ? (
          <button
            onClick={end}
            className="flex items-center gap-1.5 rounded-full bg-red-600 hover:bg-red-500 px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <PhoneOffIcon width={16} height={16} /> End stream
          </button>
        ) : (
          <button
            onClick={() => router.push("/live")}
            className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <PhoneOffIcon width={16} height={16} /> Leave
          </button>
        )}
      </div>
      {notice && <p className="text-center text-xs text-amber-300">{notice}</p>}
    </div>
  );
}

export default function LiveRoom() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-sm text-white/40">
          Loading…
        </div>
      }
    >
      <LiveRoomInner />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/useSocket";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { LiveIcon, EyeIcon, PlusIcon } from "@/components/icons";

type LiveStream = { id: string; title: string; hostName: string; viewers: number };

export default function LiveLobby() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket: socketRef, connected } = useSocket();
  const [streams, setStreams] = useState<LiveStream[]>([]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!connected || !socket) return;
    const onList = (list: LiveStream[]) => setStreams(list);
    socket.on("live:list", onList);
    socket.emit("live:list");
    return () => {
      socket.off("live:list", onList);
    };
  }, [connected, socketRef]);

  function goLive() {
    if (!user) {
      router.push("/login?next=/live");
      return;
    }
    const id = Math.random().toString(36).slice(2, 8);
    router.push(`/live/${id}?host=1`);
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-grad">Live</span> now
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Broadcast to anyone with the link, or drop into a stream.
          </p>
        </div>
        <button
          onClick={goLive}
          className="btn-grad flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shrink-0"
        >
          <LiveIcon width={18} height={18} />
          Go live
        </button>
      </div>

      <div className="mt-8">
        {streams.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-16 flex flex-col items-center gap-3 text-center">
            <LiveIcon width={34} height={34} className="text-white/20" />
            <p className="text-sm text-white/45">
              No one is live right now.
              <br />
              Be the first — hit{" "}
              <button onClick={goLive} className="text-fuchsia-400 hover:text-fuchsia-300">
                Go live
              </button>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {streams.map((s) => (
              <Link key={s.id} href={`/live/${s.id}`} className="group card-lift">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-violet-700/50 to-fuchsia-700/40 border border-white/10 group-hover:border-white/25 flex items-center justify-center">
                  <LiveIcon width={34} height={34} className="text-white/70" />
                  <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    Live
                  </span>
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px]">
                    <EyeIcon width={13} height={13} />
                    {s.viewers}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <Avatar name={s.hostName} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                    <p className="truncate text-xs text-white/45">{s.hostName}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!user && (
        <p className="mt-6 flex items-center gap-1.5 text-xs text-white/40">
          <PlusIcon width={13} height={13} />
          <Link href="/login?next=/live" className="text-fuchsia-400 hover:text-fuchsia-300">
            Sign in
          </Link>{" "}
          to start your own broadcast.
        </p>
      )}
    </div>
  );
}

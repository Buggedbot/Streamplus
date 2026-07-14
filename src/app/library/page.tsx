"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  HistoryIcon,
  BookmarkIcon,
  PlayIcon,
  PlaylistIcon,
} from "@/components/icons";

type Item = { videoId: string; title: string; src: string; at: number };
type Playlist = { id: string; title: string; items: { videoId: string }[] };

function VideoGrid({ items, empty }: { items: Item[]; empty: string }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm text-white/40">
        {empty}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-5">
      {items.map((item) => (
        <Link
          key={item.videoId}
          href={`/?v=${encodeURIComponent(item.src)}`}
          className="group"
        >
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group-hover:border-white/25 transition-colors mb-2">
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
          <p className="text-sm font-medium line-clamp-1">{item.title}</p>
        </Link>
      ))}
    </div>
  );
}

export default function LibraryPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"history" | "saved" | "playlists">("history");
  const [history, setHistory] = useState<Item[]>([]);
  const [saved, setSaved] = useState<Item[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (loading || !user) return;
    let alive = true;
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => alive && setHistory(d.history ?? []))
      .catch(() => {});
    fetch("/api/saved")
      .then((r) => r.json())
      .then((d) => alive && setSaved(Array.isArray(d.saved) ? d.saved : []))
      .catch(() => {});
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((d) => alive && setPlaylists(d.playlists ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [loading, user]);

  if (!loading && !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <HistoryIcon width={36} height={36} className="text-white/25" />
        <p className="text-sm text-white/50">
          Sign in to see your watch history and saved videos.
        </p>
        <Link
          href="/login?next=/library"
          className="rounded-full bg-violet-600 hover:bg-violet-500 px-5 py-2 text-sm font-semibold transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold">Library</h1>

      <div className="mt-4 flex gap-2">
        {(
          [
            { key: "history", label: "Continue watching", Icon: HistoryIcon },
            { key: "saved", label: "Saved", Icon: BookmarkIcon },
            { key: "playlists", label: "Playlists", Icon: PlaylistIcon },
          ] as const
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon width={16} height={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "history" && (
          <VideoGrid
            items={history}
            empty="Nothing watched yet — play something and it'll show up here."
          />
        )}
        {tab === "saved" && (
          <VideoGrid
            items={saved}
            empty="No saved videos — tap the bookmark on any video to keep it here."
          />
        )}
        {tab === "playlists" &&
          (playlists.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm text-white/40">
              No playlists yet — use “Playlist” on any video to make one.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map((p) => (
                <Link
                  key={p.id}
                  href={`/playlists/${p.id}`}
                  className="group card-lift"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-violet-700/50 to-fuchsia-700/40 border border-white/10 group-hover:border-white/25 flex items-center justify-center">
                    <PlaylistIcon width={30} height={30} className="text-white/80" />
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs">
                      {p.items.length}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold line-clamp-1">
                    {p.title}
                  </p>
                </Link>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

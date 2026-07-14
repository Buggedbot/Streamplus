"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PlaylistIcon, PlayIcon, TrashIcon } from "@/components/icons";

type Item = { videoId: string; title: string; src: string };
type Playlist = {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  items: Item[];
};

export default function PlaylistPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/playlists/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setPlaylist(d.playlist ?? null);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [params.id]);

  const isOwner = user && playlist && user.id === playlist.ownerId;

  async function remove(videoId: string) {
    if (!playlist) return;
    setPlaylist({
      ...playlist,
      items: playlist.items.filter((i) => i.videoId !== videoId),
    });
    await fetch("/api/playlists/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistId: playlist.id, videoId }),
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-white/40">
        Loading…
      </div>
    );
  }
  if (!playlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-lg font-semibold">Playlist not found</p>
        <Link href="/library" className="text-sm text-fuchsia-400 hover:text-fuchsia-300">
          Back to library →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
          <PlaylistIcon width={28} height={28} />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{playlist.title}</h1>
          <p className="text-sm text-white/50 mt-0.5">
            {playlist.ownerName} · {playlist.items.length}{" "}
            {playlist.items.length === 1 ? "video" : "videos"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        {playlist.items.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-12 text-center text-sm text-white/40">
            This playlist is empty.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {playlist.items.map((item, i) => (
              <div
                key={item.videoId}
                className="group flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors"
              >
                <span className="w-5 text-center text-sm text-white/30">
                  {i + 1}
                </span>
                <Link
                  href={`/?v=${encodeURIComponent(item.src)}`}
                  className="flex flex-1 items-center gap-3 min-w-0"
                >
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-black">
                    <video
                      src={item.src}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayIcon width={16} height={16} />
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium">{item.title}</p>
                </Link>
                {isOwner && (
                  <button
                    onClick={() => remove(item.videoId)}
                    className="shrink-0 rounded-lg p-2 text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                    aria-label="Remove"
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

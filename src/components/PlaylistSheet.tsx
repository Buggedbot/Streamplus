"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PlusIcon, CheckIcon, PlaylistIcon } from "@/components/icons";

type Playlist = {
  id: string;
  title: string;
  items: { videoId: string }[];
};

export function PlaylistSheet({
  open,
  onClose,
  video,
}: {
  open: boolean;
  onClose: () => void;
  video: { videoId: string; title: string; src: string };
}) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((d) => setPlaylists(d.playlists ?? []))
      .catch(() => {});
  }, [open]);

  const inPlaylist = (p: Playlist) =>
    p.items.some((i) => i.videoId === video.videoId);

  async function toggle(p: Playlist) {
    const has = inPlaylist(p);
    const endpoint = has ? "/api/playlists/remove" : "/api/playlists/add";
    const body = has
      ? { playlistId: p.id, videoId: video.videoId }
      : { playlistId: p.id, ...video };
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (d.playlist) {
      setPlaylists((list) => list.map((x) => (x.id === p.id ? d.playlist : x)));
    }
  }

  async function create() {
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    const r = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const d = await r.json();
    if (d.playlist) {
      // Immediately add the current video to the new playlist.
      const add = await fetch("/api/playlists/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId: d.playlist.id, ...video }),
      });
      const ad = await add.json();
      setPlaylists((list) => [ad.playlist ?? d.playlist, ...list]);
    }
    setNewTitle("");
    setCreating(false);
    setBusy(false);
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <PlaylistIcon width={18} height={18} className="text-fuchsia-400" />
          <p className="text-sm font-semibold">Save to playlist</p>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {playlists.length === 0 && !creating && (
            <p className="text-center text-sm text-white/40 py-6">
              No playlists yet.
            </p>
          )}
          {playlists.map((p) => {
            const has = inPlaylist(p);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    has
                      ? "bg-fuchsia-600 border-fuchsia-600"
                      : "border-white/25"
                  }`}
                >
                  {has && <CheckIcon width={13} height={13} />}
                </span>
                <span className="flex-1 truncate text-sm">{p.title}</span>
                <span className="text-xs text-white/40">{p.items.length}</span>
              </button>
            );
          })}
        </div>

        <div className="p-2 border-t border-white/10">
          {creating ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="Playlist name"
                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
              />
              <button
                onClick={create}
                disabled={busy || !newTitle.trim()}
                className="btn-grad rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Create
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm text-fuchsia-300"
            >
              <PlusIcon width={16} height={16} />
              New playlist
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

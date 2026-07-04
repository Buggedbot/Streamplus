"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { UsersIcon, PlayIcon } from "@/components/icons";

type Upload = { id: string; title: string; ownerId: string; src: string };

type Profile = {
  user: { id: string; name: string; email: string; bio?: string; role: string };
  counts: { followers: number; following: number };
  isFollowing: boolean;
};

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user: me } = useAuth();

  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);

  const isSelf = me?.id === id;

  useEffect(() => {
    let alive = true;
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.user) {
          setData(d);
          setName(d.user.name);
          setBio(d.user.bio || "");
        }
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    fetch(`/api/uploads?owner=${id}`)
      .then((r) => r.json())
      .then((d) => alive && setUploads(d.uploads ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);

  async function toggleFollow() {
    if (!me || !data) return;
    const on = !data.isFollowing;
    setData({
      ...data,
      isFollowing: on,
      counts: {
        ...data.counts,
        followers: data.counts.followers + (on ? 1 : -1),
      },
    });
    await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: id, on }),
    }).catch(() => {});
  }

  async function saveProfile() {
    const r = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });
    const d = await r.json();
    if (d.user && data) {
      setData({ ...data, user: { ...data.user, name: d.user.name, bio: d.user.bio } });
      setEditing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-white/40">
        Loading…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-lg font-semibold">User not found</p>
        <Link href="/people" className="text-sm text-violet-400 hover:text-violet-300">
          Find people →
        </Link>
      </div>
    );
  }

  const { user, counts } = data;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-start gap-5">
        <Avatar name={user.name} size={88} className="text-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold truncate">{user.name}</h1>
            {isSelf ? (
              <button
                onClick={() => setEditing((v) => !v)}
                className="shrink-0 rounded-full border border-white/15 px-4 py-1.5 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                {editing ? "Cancel" : "Edit profile"}
              </button>
            ) : (
              me && (
                <button
                  onClick={toggleFollow}
                  className={`shrink-0 rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
                    data.isFollowing
                      ? "border border-white/15 hover:bg-white/5"
                      : "bg-violet-600 hover:bg-violet-500"
                  }`}
                >
                  {data.isFollowing ? "Following" : "Follow"}
                </button>
              )
            )}
          </div>

          <div className="mt-2 flex gap-5 text-sm">
            <span>
              <span className="font-semibold">{counts.followers}</span>{" "}
              <span className="text-white/50">followers</span>
            </span>
            <span>
              <span className="font-semibold">{counts.following}</span>{" "}
              <span className="text-white/50">following</span>
            </span>
          </div>

          {!editing && user.bio && (
            <p className="mt-3 text-sm text-white/80 whitespace-pre-wrap">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {editing && isSelf && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio"
            rows={3}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none"
          />
          <button
            onClick={saveProfile}
            className="self-start rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold transition-colors"
          >
            Save
          </button>
        </div>
      )}

      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/80">Uploads</h2>
          {isSelf && (
            <Link
              href="/upload"
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              + Upload
            </Link>
          )}
        </div>

        {uploads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-center text-white/40 py-8">
            <UsersIcon width={28} height={28} />
            <p className="text-sm">No uploads yet.</p>
            <Link
              href="/people"
              className="mt-1 text-sm text-violet-400 hover:text-violet-300"
            >
              Find more people →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {uploads.map((u) => (
              <Link
                key={u.id}
                href={`/?v=${encodeURIComponent(u.src)}`}
                className="group"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/10 group-hover:border-white/25 transition-colors mb-1.5">
                  <video
                    src={u.src}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black scale-90 group-hover:scale-100 transition-transform">
                      <PlayIcon width={16} height={16} className="translate-x-0.5" />
                    </span>
                  </span>
                </div>
                <p className="text-xs font-medium line-clamp-1">{u.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

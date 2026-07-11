"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { REELS } from "@/lib/mock-data";
import { Avatar } from "@/components/Avatar";
import { SearchIcon, PlayIcon } from "@/components/icons";

type UserHit = { id: string; name: string; bio?: string };
type UploadHit = { id: string; title: string; ownerId: string; ownerName: string; src: string };

function SearchInner() {
  const params = useSearchParams();
  const initial = params.get("q") || "";
  const [q, setQ] = useState(initial);
  const [users, setUsers] = useState<UserHit[]>([]);
  const [uploads, setUploads] = useState<UploadHit[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const term = q.trim();
    const t = setTimeout(() => {
      if (!term) {
        setUsers([]);
        setUploads([]);
        setSearched(false);
        return;
      }
      fetch(`/api/search?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((d) => {
          setUsers(d.users ?? []);
          setUploads(d.uploads ?? []);
          setSearched(true);
        })
        .catch(() => setSearched(true));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const term = q.trim().toLowerCase();
  const reelHits = term
    ? REELS.filter(
        (r) =>
          r.caption.toLowerCase().includes(term) ||
          r.username.toLowerCase().includes(term)
      )
    : [];

  const empty =
    searched && users.length === 0 && uploads.length === 0 && reelHits.length === 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="relative">
        <SearchIcon
          width={18}
          height={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people, videos, reels…"
          className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 py-4 text-base outline-none transition-colors focus:border-violet-500 focus:bg-white/[0.07] placeholder:text-white/40"
        />
      </div>

      {empty && (
        <p className="mt-10 text-center text-sm text-white/40">
          No results for “{q.trim()}”.
        </p>
      )}

      {users.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
            People
          </h2>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] divide-y divide-white/5 overflow-hidden">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/u/${u.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <Avatar name={u.name} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  {u.bio && (
                    <p className="truncate text-xs text-white/45">{u.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {uploads.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
            Videos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {uploads.map((u) => (
              <Link key={u.id} href={`/?v=${encodeURIComponent(u.src)}`} className="group">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group-hover:border-white/25 transition-colors mb-1.5">
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
                <p className="text-xs text-white/40">{u.ownerName}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {reelHits.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
            Reels
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {reelHits.map((r) => (
              <Link key={r.id} href={`/reels?reel=${r.id}`} className="group">
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black border border-white/10 group-hover:border-white/25 transition-colors mb-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.poster}
                    alt={r.caption}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-white/70 line-clamp-1">{r.caption}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-sm text-white/40">
          Loading…
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";

type Person = {
  id: string;
  name: string;
  bio?: string;
  counts: { followers: number; following: number };
  isFollowing: boolean;
};

export default function PeoplePage() {
  const { user: me } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/people")
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setPeople(d.people ?? []);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function toggleFollow(p: Person) {
    if (!me) return;
    const on = !p.isFollowing;
    setPeople((list) =>
      list.map((x) =>
        x.id === p.id
          ? {
              ...x,
              isFollowing: on,
              counts: {
                ...x.counts,
                followers: x.counts.followers + (on ? 1 : -1),
              },
            }
          : x
      )
    );
    await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: p.id, on }),
    }).catch(() => {});
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold">Discover people</h1>
      <p className="text-sm text-white/50 mt-1">Follow creators on StreamPlus.</p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-white/40">Loading…</p>
        ) : people.length === 0 ? (
          <p className="p-8 text-center text-sm text-white/40">
            No one else here yet — invite a friend to sign up.
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {people.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/u/${p.id}`}>
                  <Avatar name={p.name} size={44} />
                </Link>
                <Link href={`/u/${p.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-white/45">
                    {p.counts.followers} followers
                    {p.bio ? ` · ${p.bio}` : ""}
                  </p>
                </Link>
                {me && (
                  <button
                    onClick={() => toggleFollow(p)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      p.isFollowing
                        ? "border border-white/15 hover:bg-white/5"
                        : "bg-violet-600 hover:bg-violet-500"
                    }`}
                  >
                    {p.isFollowing ? "Following" : "Follow"}
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

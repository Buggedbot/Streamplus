"use client";

import { useState } from "react";
import { REELS } from "@/lib/mock-data";
import { StarIcon, TrashIcon } from "@/components/icons";

type Row = {
  id: string;
  poster: string;
  caption: string;
  username: string;
  likes: number;
  featured: boolean;
};

export default function AdminContent() {
  const [rows, setRows] = useState<Row[]>(() =>
    REELS.map((r, i) => ({
      id: r.id,
      poster: r.poster,
      caption: r.caption,
      username: r.username,
      likes: r.likes,
      featured: i < 2,
    }))
  );

  function toggleFeatured(id: string) {
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, featured: !r.featured } : r))
    );
  }

  function remove(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Content</h1>
          <p className="text-sm text-white/50 mt-1">
            Manage reels & videos. Feature them to surface in Trending.
          </p>
        </div>
        <span className="text-sm text-white/40">{rows.length} items</span>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-white/40">
            No content. Everything has been removed.
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-4 p-3 sm:p-4"
              >
                <div className="h-12 w-20 shrink-0 rounded-lg overflow-hidden bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.poster}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.caption}</p>
                  <p className="truncate text-xs text-white/40">
                    {row.username} · {row.likes.toLocaleString()} likes
                  </p>
                </div>
                {row.featured && (
                  <span className="hidden sm:inline rounded-full bg-violet-500/15 text-violet-300 text-xs px-2.5 py-1">
                    Featured
                  </span>
                )}
                <button
                  onClick={() => toggleFeatured(row.id)}
                  className={`shrink-0 rounded-lg p-2 transition-colors ${
                    row.featured
                      ? "text-amber-400 hover:bg-white/5"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                  aria-label={row.featured ? "Unfeature" : "Feature"}
                  title={row.featured ? "Unfeature" : "Feature"}
                >
                  <StarIcon width={18} height={18} filled={row.featured} />
                </button>
                <button
                  onClick={() => remove(row.id)}
                  className="shrink-0 rounded-lg p-2 text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                  aria-label="Remove"
                  title="Remove"
                >
                  <TrashIcon width={18} height={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

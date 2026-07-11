"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { BellIcon, HeartIcon, CommentIcon, UsersIcon } from "@/components/icons";

type Notification = {
  id: string;
  type: string;
  text: string;
  href: string;
  at: number;
  read: boolean;
};

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function TypeIcon({ type }: { type: string }) {
  const cls = "text-violet-400";
  if (type === "follow") return <UsersIcon width={18} height={18} className={cls} />;
  if (type === "like") return <HeartIcon width={18} height={18} className="text-red-400" />;
  if (type === "comment") return <CommentIcon width={18} height={18} className={cls} />;
  return <BellIcon width={18} height={18} className={cls} />;
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let alive = true;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setItems(d.notifications ?? []);
        setReady(true);
        // Opening the page marks everything read.
        fetch("/api/notifications/read", { method: "POST" }).catch(() => {});
      })
      .catch(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [loading, user]);

  if (!loading && !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <BellIcon width={36} height={36} className="text-white/25" />
        <p className="text-sm text-white/50">Sign in to see your notifications.</p>
        <Link
          href="/login?next=/notifications"
          className="rounded-full bg-violet-600 hover:bg-violet-500 px-5 py-2 text-sm font-semibold transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold">Notifications</h1>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {!ready ? (
          <p className="p-8 text-center text-sm text-white/40">Loading…</p>
        ) : items.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-2 text-center">
            <BellIcon width={30} height={30} className="text-white/20" />
            <p className="text-sm text-white/40">
              Nothing yet — follows and comments on your videos show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map((n) => (
              <Link
                key={n.id}
                href={n.href || "#"}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/5 ${
                  n.read ? "" : "bg-violet-500/[0.06]"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
                  <TypeIcon type={n.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{n.text}</p>
                  <p className="text-xs text-white/40 mt-0.5">{timeAgo(n.at)}</p>
                </div>
                {!n.read && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

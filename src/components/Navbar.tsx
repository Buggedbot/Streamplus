"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  WatchIcon,
  ReelsIcon,
  PartyIcon,
  CommentIcon,
  ChartIcon,
  SearchIcon,
  BellIcon,
  BookmarkIcon,
  LiveIcon,
} from "@/components/icons";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Watch", Icon: WatchIcon },
  { href: "/reels", label: "Reels", Icon: ReelsIcon },
  { href: "/live", label: "Live", Icon: LiveIcon },
  { href: "/party", label: "Party", Icon: PartyIcon },
  { href: "/chat", label: "Chat", Icon: CommentIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function useUnreadCount(enabled: boolean) {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = () =>
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => alive && setUnread(d.unread ?? 0))
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // Re-check when navigating (e.g. after visiting /notifications).
  }, [enabled, pathname]);

  return unread;
}

function BellButton({ unread, className = "" }: { unread: number; className?: string }) {
  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className={`relative flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors ${className}`}
    >
      <BellIcon width={19} height={19} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const unread = useUnreadCount(Boolean(user));

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden sm:flex items-center justify-between px-6 h-16 border-b border-white/10 sticky top-0 z-40 bg-black/70 backdrop-blur-xl">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-80"
        >
          Stream
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Plus
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon width={18} height={18} />
                {label}
              </Link>
            );
          })}

          <span className="mx-2 h-6 w-px bg-white/10" />

          <Link
            href="/search"
            aria-label="Search"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              isActive(pathname, "/search")
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <SearchIcon width={19} height={19} />
          </Link>

          {user && (
            <>
              <Link
                href="/library"
                aria-label="Library"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  isActive(pathname, "/library")
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <BookmarkIcon width={18} height={18} />
              </Link>
              <BellButton unread={unread} />
            </>
          )}

          {user?.role === "admin" && (
            <Link
              href="/admin"
              aria-label="Admin"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChartIcon width={18} height={18} />
            </Link>
          )}

          {user ? (
            <Link href={`/u/${user.id}`} className="ml-1.5 flex items-center gap-2">
              <Avatar name={user.name} size={32} className="ring-1 ring-white/15" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-1.5 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </header>

      {/* Mobile top bar (logo + quick actions) — hidden on the immersive reels feed */}
      <header
        className={`${
          isActive(pathname, "/reels") ? "hidden" : "flex"
        } sm:hidden sticky top-0 z-40 items-center justify-between px-4 h-14 bg-black/80 backdrop-blur-xl border-b border-white/10`}
      >
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Stream
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Plus
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70"
          >
            <SearchIcon width={20} height={20} />
          </Link>
          {user && (
            <>
              <Link
                href="/library"
                aria-label="Library"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70"
              >
                <BookmarkIcon width={19} height={19} />
              </Link>
              <BellButton unread={unread} />
            </>
          )}
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around items-stretch bg-black/80 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        {LINKS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-white" : "text-white/45"
              }`}
            >
              <Icon width={22} height={22} />
              {label}
            </Link>
          );
        })}
        <Link
          href={user ? `/u/${user.id}` : "/login"}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
            isActive(pathname, "/u/") || isActive(pathname, "/login")
              ? "text-white"
              : "text-white/45"
          }`}
        >
          {user ? (
            <Avatar name={user.name} size={22} className="ring-1 ring-white/15" />
          ) : (
            <ChartIcon width={22} height={22} />
          )}
          {user ? "You" : "Sign in"}
        </Link>
      </nav>
    </>
  );
}

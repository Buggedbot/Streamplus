"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import {
  ChartIcon,
  FilmIcon,
  UsersIcon,
  FlagIcon,
  LogoutIcon,
} from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Overview", Icon: ChartIcon },
  { href: "/admin/content", label: "Content", Icon: FilmIcon },
  { href: "/admin/users", label: "Users", Icon: UsersIcon },
  { href: "/admin/moderation", label: "Moderation", Icon: FlagIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login?next=/admin");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/40 text-sm">
        Loading…
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-semibold">Not authorized</p>
        <p className="text-sm text-white/50">
          Your account doesn&apos;t have admin access.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15 transition-colors"
        >
          Back to StreamPlus
        </Link>
      </div>
    );
  }

  function handleSignOut() {
    signOut();
    router.replace("/");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r border-white/10 p-4 sticky top-0 h-screen">
        <Link href="/" className="px-2 text-lg font-bold tracking-tight mb-6">
          Stream<span className="text-violet-500">Plus</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon width={18} height={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-lg p-2">
          <Avatar name={user.name} size={36} className="ring-1 ring-white/15" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-white/40">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Sign out"
          >
            <LogoutIcon width={18} height={18} />
          </button>
        </div>
      </aside>

      {/* Mobile top bar + tabs */}
      <div className="md:hidden sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Stream<span className="text-violet-500">Plus</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-white/60"
          >
            <LogoutIcon width={16} height={16} />
            Sign out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto no-scrollbar px-3 pb-2">
          {NAV.map(({ href, label, Icon }) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <Icon width={16} height={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

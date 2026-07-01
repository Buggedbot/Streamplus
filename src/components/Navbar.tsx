"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WatchIcon, ReelsIcon, ChartIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Watch", Icon: WatchIcon },
  { href: "/reels", label: "Reels", Icon: ReelsIcon },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden sm:flex items-center justify-between px-6 h-16 border-b border-white/10 sticky top-0 z-40 bg-black/70 backdrop-blur-xl">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-80"
        >
          Stream<span className="text-violet-500">Plus</span>
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label, Icon }) => {
            const active = pathname === href;
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

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChartIcon width={18} height={18} />
              Admin
            </Link>
          )}

          {user ? (
            <Link href="/admin" className="ml-1 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-full bg-white/10 ring-1 ring-white/15"
              />
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around items-stretch bg-black/80 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        {LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href;
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
          href={user ? "/admin" : "/login"}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
            pathname.startsWith("/admin") || pathname.startsWith("/login")
              ? "text-white"
              : "text-white/45"
          }`}
        >
          {user ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.avatar}
              alt={user.name}
              className="h-[22px] w-[22px] rounded-full bg-white/10 ring-1 ring-white/15"
            />
          ) : (
            <ChartIcon width={22} height={22} />
          )}
          {user ? "Account" : "Sign in"}
        </Link>
      </nav>
    </>
  );
}

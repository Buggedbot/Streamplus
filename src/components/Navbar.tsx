"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Watch", icon: "▶" },
  { href: "/reels", label: "Reels", icon: "▤" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden sm:flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-40 bg-black/80 backdrop-blur">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          Stream<span className="text-violet-500">Plus</span>
        </Link>
        <nav className="flex gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around items-center bg-black/90 backdrop-blur border-t border-white/10 py-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs ${
              pathname === link.href ? "text-white" : "text-white/50"
            }`}
          >
            <span className="text-lg leading-none">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

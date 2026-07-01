"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

// Hides the main site navigation on routes that provide their own chrome
// (the admin dashboard and the login screen).
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.startsWith("/admin") || pathname.startsWith("/login");

  if (bare) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col pb-16 sm:pb-0">{children}</main>
    </>
  );
}

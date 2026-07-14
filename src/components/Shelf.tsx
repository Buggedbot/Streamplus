"use client";

import Link from "next/link";

export function Shelf({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between px-1 mb-3">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="text-xs font-medium text-white/50 hover:text-white transition-colors"
          >
            {action.label}
          </Link>
        )}
      </div>
      <div className="shelf flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {children}
      </div>
    </section>
  );
}

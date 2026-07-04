"use client";

import { useCallback, useEffect, useRef } from "react";
import { REELS } from "@/lib/mock-data";
import ReelCard from "@/components/ReelCard";

export default function ReelsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelLockedRef = useRef(false);

  // Deep-link support: /reels?reel=<id> jumps to that reel on load.
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get("reel");
    if (!target) return;
    const idx = REELS.findIndex((r) => r.id === target);
    const el = containerRef.current;
    if (idx > 0 && el) el.scrollTo({ top: idx * el.clientHeight });
  }, []);

  const scrollByOne = useCallback((direction: 1 | -1) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ top: direction * el.clientHeight, behavior: "smooth" });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (wheelLockedRef.current) return;
      wheelLockedRef.current = true;
      scrollByOne(e.deltaY > 0 ? 1 : -1);
      setTimeout(() => {
        wheelLockedRef.current = false;
      }, 500);
    },
    [scrollByOne]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") scrollByOne(1);
      if (e.key === "ArrowUp") scrollByOne(-1);
    },
    [scrollByOne]
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 sm:top-[65px] w-full overflow-y-auto snap-y-mandatory no-scrollbar outline-none bg-black"
    >
      {REELS.map((reel) => (
        <div key={reel.id} className="h-full w-full">
          <ReelCard reel={reel} />
        </div>
      ))}
    </div>
  );
}

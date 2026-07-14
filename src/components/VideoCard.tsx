"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { PlayIcon } from "@/components/icons";

type Props = {
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  // Provide one of these for the thumbnail:
  poster?: string; // image url
  videoSrc?: string; // <video> used as its own thumbnail
  aspect?: "video" | "portrait";
  active?: boolean;
  width?: string; // e.g. "w-64" for shelves
};

export function VideoCard({
  title,
  subtitle,
  href,
  onClick,
  poster,
  videoSrc,
  aspect = "video",
  active = false,
  width,
}: Props) {
  const ratio = aspect === "portrait" ? "aspect-[9/16]" : "aspect-video";

  const media = (
    <div
      className={`relative ${ratio} overflow-hidden rounded-2xl bg-neutral-900 border transition-colors ${
        active
          ? "border-fuchsia-500/70 ring-2 ring-fuchsia-500/30"
          : "border-white/10 group-hover:border-white/25"
      }`}
    >
      {videoSrc ? (
        <video
          src={videoSrc}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-violet-700/40 to-fuchsia-700/30" />
      )}

      {/* Bottom scrim */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Play affordance */}
      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black scale-90 group-hover:scale-100 transition-transform shadow-lg">
          <PlayIcon width={20} height={20} className="translate-x-0.5" />
        </span>
      </span>
    </div>
  );

  const meta = (
    <div className="mt-2.5 flex items-start gap-2.5">
      {subtitle && <Avatar name={subtitle} size={32} />}
      <div className="min-w-0">
        <p className="text-sm font-semibold line-clamp-2 leading-snug">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-white/45 line-clamp-1">{subtitle}</p>
        )}
      </div>
    </div>
  );

  const inner = (
    <div className={`group text-left ${width ?? ""} card-lift`}>
      {media}
      {meta}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none">
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className="block w-full focus:outline-none">
      {inner}
    </button>
  );
}

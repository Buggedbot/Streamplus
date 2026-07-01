import type { SVGProps } from "react";

// Minimal stroke-based icon set (Lucide-style) so the UI renders crisply and
// consistently across platforms instead of relying on emoji.

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function WatchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="m10 9 4 2.5-4 2.5V9Z" fill="currentColor" stroke="none" />
      <path d="M8 21h8" />
    </svg>
  );
}

export function ReelsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18M9 3l2 6M15 3l2 6" />
    </svg>
  );
}

export function HeartIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(props)} fill={filled ? "currentColor" : "none"}>
      <path d="M19 5.5c-1.9-1.8-4.9-1.7-6.7.2L12 6l-.3-.3C9.9 3.8 6.9 3.7 5 5.5c-2 1.9-2.1 5-.2 7l6.5 6.7a1 1 0 0 0 1.4 0L19 12.5c1.9-2 1.8-5.1-.1-7Z" />
    </svg>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4Z" />
    </svg>
  );
}

export function MutedIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" stroke="none" />
      <path d="m23 9-6 6M17 9l6 6" />
    </svg>
  );
}

export function SoundIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 3v18h18" />
      <path d="M7 15l3-4 3 2 4-6" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z" />
      <path d="M4 22v-7" />
    </svg>
  );
}

export function FilmIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M7 3v18M17 3v18M2 9h5M2 15h5M17 9h5M17 15h5" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  );
}

export function StarIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(props)} fill={filled ? "currentColor" : "none"}>
      <path d="m12 3 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17.8 6.7 19l1-5.8L3.5 9.2l5.9-.9Z" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.61 0 3.06.55 4.2 1.64l3.15-3.15C17.45 1.4 14.97.4 12 .4A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 4.75 12 4.75Z"
      />
    </svg>
  );
}

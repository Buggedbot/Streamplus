// Deterministic initials avatar so we don't depend on any external image
// service (works fully offline). Same name always yields the same color.

const COLORS = [
  "bg-violet-600",
  "bg-cyan-600",
  "bg-rose-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-indigo-600",
  "bg-pink-600",
  "bg-teal-600",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function initials(name: string) {
  const clean = name.replace(/^@/, "").replace(/[_.-]/g, " ").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const color = COLORS[hash(name) % COLORS.length];
  return (
    <span
      className={`${color} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

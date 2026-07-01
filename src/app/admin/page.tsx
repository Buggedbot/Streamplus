"use client";

import { ANALYTICS } from "@/lib/mock-data";

function formatViews(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return Math.round(n / 1_000) + "K";
  return String(n);
}

export default function AdminOverview() {
  const { totals, weeklyViews, topContent } = ANALYTICS;
  const maxView = Math.max(...weeklyViews);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-semibold">Overview</h1>
      <p className="text-sm text-white/50 mt-1">
        Platform activity at a glance.
      </p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {totals.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-xs text-white/50">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs text-emerald-400">{stat.delta}</p>
          </div>
        ))}
      </div>

      {/* Weekly views chart */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium">Views this week</p>
        <div className="mt-6 flex items-end gap-2 h-44">
          {weeklyViews.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2 h-full">
              <div className="flex-1 min-h-0 w-full flex items-end justify-center">
                <div
                  className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400"
                  style={{ height: `${Math.round((v / maxView) * 100)}%` }}
                  title={`${v}K views`}
                />
              </div>
              <span className="text-[11px] text-white/40">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top content */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <p className="text-sm font-medium p-5 pb-3">Top content</p>
        <div className="divide-y divide-white/5">
          {topContent.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-3 text-sm"
            >
              <span className="w-5 text-white/30 tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="truncate text-xs text-white/40">{item.channel}</p>
              </div>
              <span className="shrink-0 text-white/60 tabular-nums">
                {formatViews(item.views)} views
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

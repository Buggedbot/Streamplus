"use client";

import { useState } from "react";
import { REPORTS, type Report } from "@/lib/mock-data";

export default function AdminModeration() {
  const [reports, setReports] = useState<Report[]>(REPORTS);

  function act(id: string, status: "resolved" | "dismissed") {
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const pending = reports.filter((r) => r.status === "pending");
  const handled = reports.filter((r) => r.status !== "pending");

  return (
    <div className="max-w-4xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Moderation</h1>
          <p className="text-sm text-white/50 mt-1">
            Review reported content and take action.
          </p>
        </div>
        <span className="text-sm text-white/40">{pending.length} pending</span>
      </div>

      {pending.length === 0 ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/40">
          All caught up — no pending reports.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {pending.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-500/15 text-red-300 text-xs px-2.5 py-1">
                  {r.reason}
                </span>
                <span className="text-xs text-white/40">
                  reported {r.createdAt} by {r.reportedBy}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium">{r.reelCaption}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => act(r.id, "resolved")}
                  className="rounded-lg bg-red-600 hover:bg-red-500 px-3.5 py-1.5 text-xs font-medium transition-colors"
                >
                  Remove content
                </button>
                <button
                  onClick={() => act(r.id, "dismissed")}
                  className="rounded-lg border border-white/10 px-3.5 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {handled.length > 0 && (
        <div className="mt-8">
          <p className="text-xs uppercase tracking-wide text-white/30 mb-3">
            Recently handled
          </p>
          <div className="space-y-2">
            {handled.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm"
              >
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.status === "resolved"
                      ? "bg-red-500/10 text-red-300"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {r.status === "resolved" ? "Removed" : "Dismissed"}
                </span>
                <span className="truncate text-white/60">{r.reelCaption}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

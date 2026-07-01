"use client";

import { useState } from "react";
import { ADMIN_USERS, type AdminUser } from "@/lib/mock-data";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>(ADMIN_USERS);

  function toggleRole(id: string) {
    setUsers((us) =>
      us.map((u) =>
        u.id === id
          ? { ...u, role: u.role === "admin" ? "viewer" : "admin" }
          : u
      )
    );
  }

  function toggleStatus(id: string) {
    setUsers((us) =>
      us.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "suspended" : "active" }
          : u
      )
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-white/50 mt-1">
            Manage roles and account status.
          </p>
        </div>
        <span className="text-sm text-white/40">{users.length} users</span>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {/* Header (desktop) */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 text-xs text-white/40 border-b border-white/5">
          <span>User</span>
          <span className="w-20">Role</span>
          <span className="w-24">Status</span>
          <span className="w-40 text-right">Actions</span>
        </div>

        <div className="divide-y divide-white/5">
          {users.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] md:items-center gap-3 md:gap-4 px-4 md:px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="truncate text-xs text-white/40">
                  {u.email} · joined {u.joined}
                </p>
              </div>

              <span
                className={`md:w-20 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs ${
                  u.role === "admin"
                    ? "bg-violet-500/15 text-violet-300"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {u.role}
              </span>

              <span
                className={`md:w-24 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                  u.status === "active"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-red-500/15 text-red-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    u.status === "active" ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                {u.status}
              </span>

              <div className="md:w-40 flex gap-2 md:justify-end">
                <button
                  onClick={() => toggleRole(u.id)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  {u.role === "admin" ? "Demote" : "Make admin"}
                </button>
                <button
                  onClick={() => toggleStatus(u.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    u.status === "active"
                      ? "border-red-500/30 text-red-300 hover:bg-red-500/10"
                      : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                  }`}
                >
                  {u.status === "active" ? "Suspend" : "Reinstate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
  createdAt?: number;
};

function joinedLabel(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setUsers(d.users ?? []);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function toggleRole(u: AdminUser) {
    const role = u.role === "admin" ? "viewer" : "admin";
    setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, role } : x)));
    await fetch("/api/admin/users/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id, role }),
    }).catch(() => {});
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-white/50 mt-1">
            Real registered accounts. Promote or demote admins.
          </p>
        </div>
        <span className="text-sm text-white/40">{users.length} users</span>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-white/40">Loading…</p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-sm text-white/40">
            No users yet — sign someone up.
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] md:items-center gap-3 md:gap-4 px-4 md:px-5 py-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.name} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-white/40">
                      {u.email}
                      {u.createdAt ? ` · joined ${joinedLabel(u.createdAt)}` : ""}
                    </p>
                  </div>
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

                <button
                  onClick={() => toggleRole(u)}
                  className="md:w-28 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  {u.role === "admin" ? "Demote" : "Make admin"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

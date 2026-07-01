"use client";

import { useSyncExternalStore } from "react";

export type Role = "admin" | "viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
};

const STORAGE_KEY = "streamplus.user";

// NOTE: This is a mock auth layer that persists a fake session in
// localStorage so the login flow and protected admin routes are fully
// clickable with no backend. To go live, replace signInWithGoogle with a
// real Auth.js (NextAuth) Google provider and read the session server-side.
const MOCK_GOOGLE_USER: User = {
  id: "u_admin",
  name: "Demo Admin",
  email: "admin@streamplus.app",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Demo%20Admin",
  role: "admin",
};

// --- Module-level store backed by localStorage -----------------------------

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedUser: User | null = null;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): User | null {
  const raw = readRaw();
  // Only re-parse (and hand back a new object reference) when the underlying
  // string changed, so useSyncExternalStore stays stable between renders.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

function getServerSnapshot(): User | null {
  return null;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function emit() {
  for (const l of listeners) l();
}

function writeUser(user: User | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failure
  }
  emit();
}

// --- Public hook -----------------------------------------------------------

export function useAuth() {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // `false` on the server / during hydration, `true` once mounted on the
  // client — a clean loading gate with no setState-in-effect.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  return {
    user: hydrated ? user : null,
    loading: !hydrated,
    signInWithGoogle: () => writeUser(MOCK_GOOGLE_USER),
    signOut: () => writeUser(null),
  };
}

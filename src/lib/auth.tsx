"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Role = "admin" | "viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  bio?: string;
  createdAt?: number;
};

type AuthResult = { error?: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setUser(d.user ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function signUp(name: string, email: string, password: string) {
    const { ok, data } = await postJson("/api/auth/signup", {
      name,
      email,
      password,
    });
    if (ok) {
      setUser(data.user);
      return {};
    }
    return { error: data.error || "Could not sign up." };
  }

  async function signIn(email: string, password: string) {
    const { ok, data } = await postJson("/api/auth/login", { email, password });
    if (ok) {
      setUser(data.user);
      return {};
    }
    return { error: data.error || "Could not sign in." };
  }

  async function signInWithGoogle() {
    const { ok, data } = await postJson("/api/auth/demo");
    if (ok) {
      setUser(data.user);
      return {};
    }
    return { error: data.error || "Could not sign in." };
  }

  async function signOut() {
    await postJson("/api/auth/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signUp, signIn, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

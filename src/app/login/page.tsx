"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { GoogleIcon } from "@/components/icons";

function LoginInner() {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result =
      mode === "signup"
        ? await signUp(name, email, password)
        : await signIn(email, password);
    setBusy(false);
    if (result.error) setError(result.error);
    else router.replace(next);
  }

  async function demo() {
    setBusy(true);
    setError("");
    const result = await signInWithGoogle();
    setBusy(false);
    if (result.error) setError(result.error);
    else router.replace(next);
  }

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="block text-center text-2xl font-bold tracking-tight mb-2"
      >
        Stream<span className="text-violet-500">Plus</span>
      </Link>
      <p className="text-center text-sm text-white/50 mb-8">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </p>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <button
          onClick={demo}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-black font-medium py-3 hover:bg-white/90 active:scale-[0.99] transition disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-white/30">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-violet-500 placeholder:text-white/40"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-violet-500 placeholder:text-white/40"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-violet-500 placeholder:text-white/40"
          />
          {error && <p className="text-red-400 text-xs px-1">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.99] transition py-3 text-sm font-semibold disabled:opacity-60"
          >
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-white/45">
          {mode === "signup" ? "Already have an account?" : "New to StreamPlus?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError("");
            }}
            className="text-violet-400 hover:text-violet-300 font-medium"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-white/30">
        <Link href="/" className="hover:text-white/60 transition-colors">
          ← Back to StreamPlus
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-black">
      <Suspense fallback={<p className="text-sm text-white/40">Loading…</p>}>
        <LoginInner />
      </Suspense>
    </div>
  );
}

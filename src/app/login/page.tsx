"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { GoogleIcon } from "@/components/icons";

function LoginInner() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="block text-center text-2xl font-bold tracking-tight mb-2"
      >
        Stream<span className="text-violet-500">Plus</span>
      </Link>
      <p className="text-center text-sm text-white/50 mb-8">
        Sign in to continue
      </p>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-black font-medium py-3 hover:bg-white/90 active:scale-[0.99] transition"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="mt-4 text-center text-xs text-white/35 leading-relaxed">
          Demo sign-in — creates a local admin session so you can explore the
          dashboard. No real Google account is used.
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

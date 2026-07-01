"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartyIcon, PlusIcon, LinkIcon } from "@/components/icons";

function newRoomId() {
  return Math.random().toString(36).slice(2, 8);
}

export default function PartyLobby() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [joinCode, setJoinCode] = useState("");

  function startParty() {
    const id = newRoomId();
    const q = videoUrl.trim()
      ? `?v=${encodeURIComponent(videoUrl.trim())}`
      : "";
    router.push(`/party/${id}${q}`);
  }

  function joinParty(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().replace(/.*\/party\//, "");
    if (code) router.push(`/party/${code}`);
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-10 sm:py-16 flex flex-col gap-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-400">
          <PartyIcon width={28} height={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Watch Party</h1>
        <p className="mt-2 text-sm text-white/50">
          Watch together in sync, chat, and hop on voice — invite friends with a
          link.
        </p>
      </div>

      {/* Start a party */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <label className="text-sm font-medium">Start a new party</label>
        <div className="mt-3 relative">
          <LinkIcon
            width={18}
            height={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Video link to watch (optional)"
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm outline-none focus:border-violet-500 placeholder:text-white/40"
          />
        </div>
        <button
          onClick={startParty}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.99] transition py-3 text-sm font-semibold"
        >
          <PlusIcon width={18} height={18} />
          Create party room
        </button>
      </div>

      {/* Join a party */}
      <form
        onSubmit={joinParty}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      >
        <label className="text-sm font-medium">Join with a code or link</label>
        <div className="mt-3 flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="e.g. 7xk2p9"
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-violet-500 placeholder:text-white/40"
          />
          <button
            type="submit"
            disabled={!joinCode.trim()}
            className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-40"
          >
            Join
          </button>
        </div>
      </form>
    </div>
  );
}

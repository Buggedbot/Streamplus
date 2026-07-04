"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/Avatar";
import { SendIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth";

export type Comment = {
  id: string;
  userId: string;
  name: string;
  text: string;
  at: number;
};

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function CommentsSheet({
  open,
  comments,
  onClose,
  onPost,
}: {
  open: boolean;
  comments: Comment[];
  onClose: () => void;
  onPost: (text: string) => void;
}) {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [comments.length, open]);

  if (!open || typeof document === "undefined") return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    onPost(text);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close comments"
      />
      <div className="relative flex flex-col max-h-[75vh] w-full max-w-md mx-auto rounded-t-2xl bg-neutral-900 border-t border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-sm font-semibold">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </p>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-sm"
          >
            Close
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-center text-sm text-white/40 py-6">
              No comments yet — be the first.
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar name={c.name} size={32} />
              <div className="min-w-0">
                <p className="text-xs text-white/50">
                  {c.name} · {timeAgo(c.at)}
                </p>
                <p className="text-sm break-words">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={submit}
          className="flex items-center gap-2 p-3 border-t border-white/10"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={user ? "Add a comment…" : "Sign in to comment…"}
            className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition active:scale-95"
            aria-label="Post comment"
          >
            <SendIcon width={18} height={18} />
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CONVERSATIONS } from "@/lib/mock-data";
import { useSocket } from "@/lib/useSocket";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { SendIcon, ArrowLeftIcon, CommentIcon } from "@/components/icons";

type DM = {
  id: string;
  fromId: string;
  name: string;
  text: string;
};

export default function ChatPage() {
  const { socket: socketRef, connected } = useSocket();
  const { user } = useAuth();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [myId, setMyId] = useState("");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [guestName] = useState(
    () => `Guest-${Math.random().toString(36).slice(2, 6)}`
  );
  const name = user?.name || guestName;
  const nameRef = useRef(name);
  useEffect(() => {
    nameRef.current = name;
  });

  const active = useMemo(
    () => CONVERSATIONS.find((c) => c.id === activeId) ?? null,
    [activeId]
  );

  // Join the selected conversation channel and stream its messages.
  useEffect(() => {
    const socket = socketRef.current;
    if (!connected || !socket || !activeId) return;

    const onHistory = (data: {
      channelId: string;
      messages: DM[];
      youId?: string;
    }) => {
      if (data.channelId !== activeId) return;
      if (data.youId) setMyId(data.youId);
      setMessages(data.messages ?? []);
    };
    const onMessage = (m: DM & { channelId: string }) => {
      if (m.channelId !== activeId) return;
      setMessages((prev) => [...prev, m]);
    };

    socket.on("dm:history", onHistory);
    socket.on("dm:message", onMessage);
    socket.emit("dm:join", { channelId: activeId });

    return () => {
      socket.emit("dm:leave", { channelId: activeId });
      socket.off("dm:history", onHistory);
      socket.off("dm:message", onMessage);
    };
  }, [connected, activeId, socketRef]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, activeId]);

  function openConversation(id: string) {
    setActiveId(id);
    setMessages([]);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft("");
    socketRef.current?.emit("dm:send", {
      channelId: activeId,
      text,
      name: nameRef.current,
    });
  }

  return (
    <div className="flex-1 min-h-0 flex w-full max-w-6xl mx-auto sm:px-4 sm:py-4">
      <div className="flex-1 min-h-0 flex sm:rounded-2xl sm:border sm:border-white/10 overflow-hidden bg-white/[0.02]">
        {/* Conversation list */}
        <aside
          className={`${
            activeId ? "hidden sm:flex" : "flex"
          } w-full sm:w-80 shrink-0 flex-col border-r border-white/10`}
        >
          <div className="px-4 h-14 flex items-center justify-between border-b border-white/10">
            <h1 className="text-base font-semibold">Messages</h1>
            <span
              className={`text-xs ${
                connected ? "text-emerald-400" : "text-white/40"
              }`}
            >
              {connected ? "online" : "connecting…"}
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {CONVERSATIONS.map((c) => {
              const activeRow = c.id === activeId;
              return (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeRow ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="relative">
                    <Avatar name={c.name} size={44} />
                    {c.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-black" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-white/45">
                      {c.username}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Thread */}
        <section
          className={`${
            activeId ? "flex" : "hidden sm:flex"
          } flex-1 min-w-0 flex-col`}
        >
          {active ? (
            <>
              <div className="px-3 sm:px-4 h-14 flex items-center gap-3 border-b border-white/10">
                <button
                  onClick={() => setActiveId(null)}
                  className="sm:hidden -ml-1 p-1 text-white/70"
                  aria-label="Back"
                >
                  <ArrowLeftIcon width={20} height={20} />
                </button>
                <Avatar name={active.name} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">
                    {active.name}
                  </p>
                  <p className="text-xs text-white/45">{active.username}</p>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 space-y-2"
              >
                {messages.length === 0 && (
                  <p className="text-center text-xs text-white/35 pt-4">
                    No messages yet — say hello 👋
                  </p>
                )}
                {messages.map((m) => {
                  const mine = m.fromId === myId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        mine ? "items-end" : "items-start"
                      }`}
                    >
                      {!mine && (
                        <span className="text-[11px] text-white/40 px-1">
                          {m.name}
                        </span>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          mine
                            ? "bg-violet-600 text-white rounded-br-md"
                            : "bg-white/10 text-white rounded-bl-md"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={send}
                className="p-3 border-t border-white/10 flex items-center gap-2"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Message…"
                  className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition disabled:opacity-40 hover:bg-violet-500 active:scale-95"
                  aria-label="Send"
                >
                  <SendIcon width={18} height={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <CommentIcon width={40} height={40} className="text-white/25" />
              <p className="text-sm text-white/50">
                Select a conversation to start chatting.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

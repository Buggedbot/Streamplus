"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  PARTY_PARTICIPANTS,
  PARTY_CHAT_SEED,
  AUTO_REPLIES,
  DEFAULT_PARTY_VIDEO,
  type ChatMessage,
} from "@/lib/mock-data";
import { Avatar } from "@/components/Avatar";
import {
  PlayIcon,
  PauseIcon,
  MicIcon,
  MicOffIcon,
  ScreenShareIcon,
  PhoneOffIcon,
  CopyIcon,
  CheckIcon,
  SendIcon,
  UsersIcon,
  CommentIcon,
} from "@/components/icons";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

function RoomInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const roomId = params.id;
  const videoUrl = search.get("v") || DEFAULT_PARTY_VIDEO;

  const [playing, setPlaying] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"chat" | "people">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>(PARTY_CHAT_SEED);
  const [draft, setDraft] = useState("");

  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Stop any live media tracks when leaving the room.
  useEffect(() => {
    return () => {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Bind the captured screen stream to the preview element.
  useEffect(() => {
    if (sharing && screenVideoRef.current && screenStreamRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
    }
  }, [sharing]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
    });
  }, [messages.length, tab]);

  function flashNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  }

  async function toggleMic() {
    if (micOn) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setMicOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicOn(true);
    } catch {
      flashNotice("Couldn't access your microphone (permission or device).");
    }
  }

  function stopSharing() {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setSharing(false);
  }

  async function toggleShare() {
    if (sharing) {
      stopSharing();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener("ended", stopSharing);
      setSharing(true);
    } catch {
      flashNotice("Screen share was cancelled or isn't available here.");
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      flashNotice("Couldn't copy — copy the URL from the address bar.");
    }
  }

  function leave() {
    stopSharing();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    router.push("/party");
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((ms) => [
      ...ms,
      { id: `me-${Date.now()}`, from: "me", text, time: "now" },
    ]);
    const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
    setTimeout(() => {
      setMessages((ms) => [
        ...ms,
        { id: `them-${Date.now()}`, from: "them", text: reply, time: "now" },
      ]);
    }, 1000);
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-white/40">Watch party</p>
          <p className="font-mono text-sm font-semibold truncate">
            Room {roomId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyInvite}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium hover:bg-white/5 transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon width={15} height={15} className="text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon width={15} height={15} />
                Invite
              </>
            )}
          </button>
          <button
            onClick={leave}
            className="flex items-center gap-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 px-3 py-2 text-xs font-medium transition-colors"
          >
            <PhoneOffIcon width={15} height={15} />
            Leave
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {notice}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Player + controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
            {sharing ? (
              <>
                <video
                  ref={screenVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-contain bg-black"
                />
                <span className="absolute top-3 left-3 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-medium">
                  You&apos;re sharing your screen
                </span>
              </>
            ) : (
              <ReactPlayer
                key={videoUrl}
                src={videoUrl}
                playing={playing}
                controls
                width="100%"
                height="100%"
              />
            )}
          </div>

          {/* Control bar */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setPlaying((p) => !p)}
              disabled={sharing}
              className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-40 px-4 py-2.5 text-sm font-medium transition-colors"
              title="Play/pause for everyone"
            >
              {playing ? (
                <PauseIcon width={18} height={18} />
              ) : (
                <PlayIcon width={18} height={18} />
              )}
              <span className="hidden sm:inline">
                {playing ? "Pause" : "Play"}
              </span>
            </button>

            <button
              onClick={toggleMic}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                micOn
                  ? "bg-violet-600 hover:bg-violet-500"
                  : "bg-white/10 hover:bg-white/15"
              }`}
              aria-pressed={micOn}
              title={micOn ? "Mute mic" : "Turn on mic"}
            >
              {micOn ? (
                <MicIcon width={18} height={18} />
              ) : (
                <MicOffIcon width={18} height={18} />
              )}
            </button>

            <button
              onClick={toggleShare}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                sharing
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-white/10 hover:bg-white/15"
              }`}
              aria-pressed={sharing}
              title={sharing ? "Stop sharing" : "Share your screen"}
            >
              <ScreenShareIcon width={18} height={18} />
            </button>
          </div>

          <p className="text-center text-xs text-white/35">
            Play/pause and voice sync to everyone in the room once the realtime
            server is connected.
          </p>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden h-[420px] lg:h-auto lg:min-h-[420px]">
          <div className="flex border-b border-white/10">
            {(["chat", "people"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? "text-white border-b-2 border-violet-500"
                    : "text-white/45 hover:text-white"
                }`}
              >
                {t === "chat" ? (
                  <CommentIcon width={16} height={16} />
                ) : (
                  <UsersIcon width={16} height={16} />
                )}
                {t === "people" ? `People · ${PARTY_PARTICIPANTS.length}` : "Chat"}
              </button>
            ))}
          </div>

          {tab === "chat" ? (
            <>
              <div
                ref={chatScrollRef}
                className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.from === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                        m.from === "me"
                          ? "bg-violet-600 rounded-br-md"
                          : "bg-white/10 rounded-bl-md"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={sendChat}
                className="p-2.5 border-t border-white/10 flex items-center gap-2"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Say something…"
                  className="flex-1 rounded-full bg-white/5 border border-white/10 px-3.5 py-2 text-sm outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition active:scale-95"
                  aria-label="Send"
                >
                  <SendIcon width={16} height={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-2">
              {PARTY_PARTICIPANTS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg"
                >
                  <Avatar name={p.name} size={36} />
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  {p.host && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PartyRoom() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-sm text-white/40">
          Loading room…
        </div>
      }
    >
      <RoomInner />
    </Suspense>
  );
}

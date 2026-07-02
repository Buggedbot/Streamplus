"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PARTY_VIDEO } from "@/lib/mock-data";
import { useSocket } from "@/lib/useSocket";
import { useWebRTC, type RemoteMedia } from "@/lib/useWebRTC";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import {
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

type ChatMsg = {
  id: string;
  fromId: string;
  name: string;
  text: string;
};

type Participant = { id: string; name: string };

function MediaTile({
  stream,
  label,
  muted,
}: {
  stream: MediaStream;
  label: string;
  muted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  const hasVideo = stream.getVideoTracks().length > 0;
  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover ${hasVideo ? "" : "opacity-0"}`}
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar name={label} size={40} />
        </div>
      )}
      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px]">
        {label}
      </span>
    </div>
  );
}

function RoomInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const roomId = params.id;
  const videoUrl = search.get("v") || DEFAULT_PARTY_VIDEO;

  const { socket: socketRef, connected } = useSocket();
  const { micOn, sharing, localScreen, remotes, notice, toggleMic, toggleShare } =
    useWebRTC(socketRef, connected);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myId, setMyId] = useState("");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"chat" | "people">("chat");

  const videoRef = useRef<HTMLVideoElement>(null);
  const applyingRemote = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [guestName] = useState(
    () => `Guest-${Math.random().toString(36).slice(2, 6)}`
  );
  const name = user?.name || guestName;
  const nameRef = useRef(name);
  useEffect(() => {
    nameRef.current = name;
  });

  // Apply an authoritative playback state coming from the room.
  const applyPlayback = useCallback(
    (pb: { playing: boolean; time: number; at: number }) => {
      const v = videoRef.current;
      if (!v) return;
      applyingRemote.current = true;
      const elapsed = pb.playing ? (Date.now() - pb.at) / 1000 : 0;
      const target = pb.time + elapsed;
      if (Number.isFinite(target) && Math.abs(v.currentTime - target) > 1.5) {
        v.currentTime = target;
      }
      if (pb.playing && v.paused) v.play().catch(() => {});
      if (!pb.playing && !v.paused) v.pause();
      setTimeout(() => {
        applyingRemote.current = false;
      }, 400);
    },
    []
  );

  // Wire up realtime: join the room and subscribe to chat/presence/playback.
  useEffect(() => {
    const socket = socketRef.current;
    if (!connected || !socket) return;

    const onSync = (data: {
      playback: { playing: boolean; time: number; at: number };
      messages: ChatMsg[];
      you?: { id: string; name: string };
    }) => {
      setMessages(data.messages ?? []);
      if (data.you?.id) setMyId(data.you.id);
      applyPlayback(data.playback);
    };
    const onPresence = (p: Participant[]) => setParticipants(p);
    const onChat = (m: ChatMsg) => setMessages((prev) => [...prev, m]);
    const onPlayback = (pb: { playing: boolean; time: number; at: number }) =>
      applyPlayback(pb);

    socket.on("sync", onSync);
    socket.on("presence", onPresence);
    socket.on("chat", onChat);
    socket.on("playback", onPlayback);

    socket.emit("join", { roomId, name: nameRef.current });

    return () => {
      socket.off("sync", onSync);
      socket.off("presence", onPresence);
      socket.off("chat", onChat);
      socket.off("playback", onPlayback);
      socket.emit("leave");
    };
  }, [connected, roomId, socketRef, applyPlayback]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
    });
  }, [messages.length, tab]);

  function emitPlayback() {
    if (applyingRemote.current) return;
    const v = videoRef.current;
    if (!v) return;
    socketRef.current?.emit("playback", {
      playing: !v.paused,
      time: v.currentTime,
    });
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    socketRef.current?.emit("chat", { text });
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user can copy from the address bar */
    }
  }

  function leave() {
    router.push("/party");
  }

  const mediaTiles: RemoteMedia[] = remotes;
  const showStrip = Boolean(localScreen) || mediaTiles.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-white/40">
            Watch party ·{" "}
            <span className={connected ? "text-emerald-400" : "text-white/40"}>
              {connected ? "connected" : "connecting…"}
            </span>
          </p>
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
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              muted
              playsInline
              className="h-full w-full"
              onPlay={emitPlayback}
              onPause={emitPlayback}
              onSeeked={emitPlayback}
            />
          </div>

          {/* Voice / screen media strip */}
          {showStrip && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {localScreen && (
                <MediaTile stream={localScreen} label="You (screen)" muted />
              )}
              {mediaTiles.map((r) => (
                <MediaTile key={r.id} stream={r.stream} label={r.name} />
              ))}
            </div>
          )}

          {/* Control bar */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={toggleMic}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                micOn
                  ? "bg-violet-600 hover:bg-violet-500"
                  : "bg-white/10 hover:bg-white/15"
              }`}
              aria-pressed={micOn}
            >
              {micOn ? (
                <MicIcon width={18} height={18} />
              ) : (
                <MicOffIcon width={18} height={18} />
              )}
              <span className="hidden sm:inline">
                {micOn ? "Mic on" : "Mic"}
              </span>
            </button>

            <button
              onClick={toggleShare}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                sharing
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-white/10 hover:bg-white/15"
              }`}
              aria-pressed={sharing}
            >
              <ScreenShareIcon width={18} height={18} />
              <span className="hidden sm:inline">
                {sharing ? "Stop share" : "Share screen"}
              </span>
            </button>
          </div>

          <p className="text-center text-xs text-white/35">
            Playback stays in sync for everyone in the room. Mic & screen share
            stream peer-to-peer over WebRTC.
          </p>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden h-[420px] lg:h-auto lg:min-h-[460px]">
          <div className="flex border-b border-white/10">
            {(["chat", "people"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? "text-white border-b-2 border-violet-500"
                    : "text-white/45 hover:text-white"
                }`}
              >
                {t === "chat" ? (
                  <>
                    <CommentIcon width={16} height={16} />
                    Chat
                  </>
                ) : (
                  <>
                    <UsersIcon width={16} height={16} />
                    People · {participants.length}
                  </>
                )}
              </button>
            ))}
          </div>

          {tab === "chat" ? (
            <>
              <div
                ref={chatScrollRef}
                className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2"
              >
                {messages.length === 0 && (
                  <p className="text-center text-xs text-white/35 pt-4">
                    Say hi 👋
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
                        className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                          mine
                            ? "bg-violet-600 rounded-br-md"
                            : "bg-white/10 rounded-bl-md"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
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
              {participants.length === 0 && (
                <p className="text-center text-xs text-white/35 pt-4">
                  Waiting for people to join…
                </p>
              )}
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg"
                >
                  <Avatar name={p.name} size={36} />
                  <span className="flex-1 text-sm font-medium">
                    {p.name}
                    {p.id === myId && (
                      <span className="text-white/40"> (You)</span>
                    )}
                  </span>
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

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
  CameraIcon,
  CameraOffIcon,
  ScreenShareIcon,
  PhoneOffIcon,
  CopyIcon,
  CheckIcon,
  SendIcon,
  UsersIcon,
  CommentIcon,
  CrownIcon,
  PlaylistIcon,
  PlayIcon,
  TrashIcon,
  LinkIcon,
} from "@/components/icons";

type ChatMsg = { id: string; fromId: string; name: string; text: string };
type Participant = { id: string; name: string; isHost?: boolean };
type QueueItem = { id: string; title: string; src: string; by: string; byId: string };
type NowPlaying = { title: string; src: string };

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
  const initialVideo = search.get("v") || DEFAULT_PARTY_VIDEO;

  const { socket: socketRef, connected } = useSocket();
  const {
    micOn,
    camOn,
    sharing,
    localScreen,
    localCam,
    remotes,
    notice,
    toggleMic,
    toggleCam,
    toggleShare,
  } = useWebRTC(socketRef, connected);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myId, setMyId] = useState("");
  const [hostId, setHostId] = useState("");
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueDraft, setQueueDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"chat" | "people" | "queue">("chat");

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

  const isHost = Boolean(myId) && myId === hostId;
  const activeVideo = nowPlaying?.src || initialVideo;

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
      host?: string;
      queue?: { items: QueueItem[]; current: NowPlaying | null };
    }) => {
      setMessages(data.messages ?? []);
      if (data.you?.id) setMyId(data.you.id);
      if (data.host) setHostId(data.host);
      if (data.queue) {
        setQueue(data.queue.items ?? []);
        setNowPlaying(data.queue.current ?? null);
      }
      applyPlayback(data.playback);
    };
    const onPresence = (p: Participant[]) => setParticipants(p);
    const onHost = (id: string | null) => setHostId(id || "");
    const onChat = (m: ChatMsg) => setMessages((prev) => [...prev, m]);
    const onPlayback = (pb: { playing: boolean; time: number; at: number }) =>
      applyPlayback(pb);
    const onQueue = (q: { items: QueueItem[]; current: NowPlaying | null }) => {
      setQueue(q.items ?? []);
      if (q.current) setNowPlaying(q.current);
    };
    const onNowPlaying = (np: NowPlaying) => setNowPlaying(np);

    socket.on("sync", onSync);
    socket.on("presence", onPresence);
    socket.on("host", onHost);
    socket.on("chat", onChat);
    socket.on("playback", onPlayback);
    socket.on("queue", onQueue);
    socket.on("nowplaying", onNowPlaying);

    socket.emit("join", { roomId, name: nameRef.current });

    return () => {
      socket.off("sync", onSync);
      socket.off("presence", onPresence);
      socket.off("host", onHost);
      socket.off("chat", onChat);
      socket.off("playback", onPlayback);
      socket.off("queue", onQueue);
      socket.off("nowplaying", onNowPlaying);
      socket.emit("leave");
    };
  }, [connected, roomId, socketRef, applyPlayback]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight });
  }, [messages.length, tab]);

  function emitPlayback() {
    if (applyingRemote.current || !isHost) return;
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

  function addToQueue(e: React.FormEvent) {
    e.preventDefault();
    const src = queueDraft.trim();
    if (!src) return;
    try {
      new URL(src);
    } catch {
      return;
    }
    const title = src.split("/").pop()?.slice(0, 60) || "Video";
    socketRef.current?.emit("queue:add", { title, src });
    setQueueDraft("");
  }

  function playNow(item: QueueItem) {
    socketRef.current?.emit("queue:play", { title: item.title, src: item.src });
  }

  function removeFromQueue(id: string) {
    socketRef.current?.emit("queue:remove", { id });
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
  const showStrip = Boolean(localScreen) || Boolean(localCam) || mediaTiles.length > 0;

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
          <p className="font-mono text-sm font-semibold truncate flex items-center gap-1.5">
            Room {roomId}
            {isHost && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-300 px-2 py-0.5 text-[10px] font-sans font-semibold not-italic">
                <CrownIcon width={11} height={11} /> Host
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyInvite}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-medium hover:bg-white/5 transition-colors"
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
            className="flex items-center gap-1.5 rounded-full bg-red-600/90 hover:bg-red-600 px-3 py-2 text-xs font-medium transition-colors"
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
            <video
              ref={videoRef}
              key={activeVideo}
              src={activeVideo}
              controls={isHost}
              muted
              playsInline
              className="h-full w-full"
              onPlay={emitPlayback}
              onPause={emitPlayback}
              onSeeked={emitPlayback}
            />
            {!isHost && (
              <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white/80 flex items-center gap-1.5">
                <CrownIcon width={12} height={12} className="text-amber-300" />
                Host controls playback
              </div>
            )}
          </div>

          {/* Voice / camera / screen media strip */}
          {showStrip && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {localCam && <MediaTile stream={localCam} label="You (cam)" muted />}
              {localScreen && (
                <MediaTile stream={localScreen} label="You (screen)" muted />
              )}
              {mediaTiles.map((r) => (
                <MediaTile key={r.id} stream={r.stream} label={r.name} />
              ))}
            </div>
          )}

          {/* Control bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={toggleMic}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                micOn ? "bg-violet-600 hover:bg-violet-500" : "bg-white/10 hover:bg-white/15"
              }`}
              aria-pressed={micOn}
            >
              {micOn ? <MicIcon width={18} height={18} /> : <MicOffIcon width={18} height={18} />}
              <span className="hidden sm:inline">{micOn ? "Mic on" : "Mic"}</span>
            </button>

            <button
              onClick={toggleCam}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                camOn ? "bg-violet-600 hover:bg-violet-500" : "bg-white/10 hover:bg-white/15"
              }`}
              aria-pressed={camOn}
            >
              {camOn ? (
                <CameraIcon width={18} height={18} />
              ) : (
                <CameraOffIcon width={18} height={18} />
              )}
              <span className="hidden sm:inline">{camOn ? "Cam on" : "Camera"}</span>
            </button>

            <button
              onClick={toggleShare}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                sharing ? "bg-emerald-600 hover:bg-emerald-500" : "bg-white/10 hover:bg-white/15"
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
            The host controls playback for everyone. Anyone can add to the queue;
            mic, camera & screen stream peer-to-peer over WebRTC.
          </p>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden h-[460px] lg:h-auto lg:min-h-[500px]">
          <div className="flex border-b border-white/10">
            {(["chat", "queue", "people"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? "text-white border-b-2 border-fuchsia-500"
                    : "text-white/45 hover:text-white"
                }`}
              >
                {t === "chat" && (
                  <>
                    <CommentIcon width={15} height={15} /> Chat
                  </>
                )}
                {t === "queue" && (
                  <>
                    <PlaylistIcon width={15} height={15} /> Queue
                    {queue.length > 0 && (
                      <span className="text-white/40">· {queue.length}</span>
                    )}
                  </>
                )}
                {t === "people" && (
                  <>
                    <UsersIcon width={15} height={15} /> {participants.length}
                  </>
                )}
              </button>
            ))}
          </div>

          {tab === "chat" && (
            <>
              <div
                ref={chatScrollRef}
                className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2"
              >
                {messages.length === 0 && (
                  <p className="text-center text-xs text-white/35 pt-4">Say hi 👋</p>
                )}
                {messages.map((m) => {
                  const mine = m.fromId === myId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                    >
                      {!mine && (
                        <span className="text-[11px] text-white/40 px-1">{m.name}</span>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                          mine ? "bg-fuchsia-600 rounded-br-md" : "bg-white/10 rounded-bl-md"
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
                  className="flex-1 rounded-full bg-white/5 border border-white/10 px-3.5 py-2 text-sm outline-none focus:border-fuchsia-500"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 transition active:scale-95"
                  aria-label="Send"
                >
                  <SendIcon width={16} height={16} />
                </button>
              </form>
            </>
          )}

          {tab === "queue" && (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                {queue.length === 0 && (
                  <p className="text-center text-xs text-white/35 pt-4">
                    Queue is empty — paste a link below to add.
                  </p>
                )}
                {queue.map((item) => {
                  const isCurrent = nowPlaying?.src === item.src;
                  const canRemove = isHost || item.byId === myId;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded-lg px-2 py-2 ${
                        isCurrent ? "bg-fuchsia-500/10" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="truncate text-[11px] text-white/40">
                          {isCurrent ? "Now playing · " : ""}added by {item.by}
                        </p>
                      </div>
                      {isHost && !isCurrent && (
                        <button
                          onClick={() => playNow(item)}
                          className="shrink-0 rounded-md p-1.5 text-fuchsia-300 hover:bg-white/10"
                          aria-label="Play now"
                          title="Play for everyone"
                        >
                          <PlayIcon width={15} height={15} />
                        </button>
                      )}
                      {canRemove && (
                        <button
                          onClick={() => removeFromQueue(item.id)}
                          className="shrink-0 rounded-md p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10"
                          aria-label="Remove"
                        >
                          <TrashIcon width={15} height={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <form
                onSubmit={addToQueue}
                className="p-2.5 border-t border-white/10 flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <LinkIcon
                    width={15}
                    height={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    value={queueDraft}
                    onChange={(e) => setQueueDraft(e.target.value)}
                    placeholder="Paste a video link…"
                    className="w-full rounded-full bg-white/5 border border-white/10 pl-8 pr-3 py-2 text-sm outline-none focus:border-fuchsia-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!queueDraft.trim()}
                  className="btn-grad rounded-full px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                >
                  Add
                </button>
              </form>
            </>
          )}

          {tab === "people" && (
            <div className="flex-1 min-h-0 overflow-y-auto p-2">
              {participants.length === 0 && (
                <p className="text-center text-xs text-white/35 pt-4">
                  Waiting for people to join…
                </p>
              )}
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-2 py-2.5 rounded-lg">
                  <Avatar name={p.name} size={36} />
                  <span className="flex-1 text-sm font-medium flex items-center gap-1.5">
                    {p.name}
                    {p.id === myId && <span className="text-white/40"> (You)</span>}
                    {p.isHost && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-300 px-1.5 py-0.5 text-[10px] font-semibold">
                        <CrownIcon width={10} height={10} /> Host
                      </span>
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

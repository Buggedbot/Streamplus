"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export type RemoteMedia = { id: string; name: string; stream: MediaStream };

type Participant = { id: string; name: string };

// Full-mesh WebRTC for a watch-party room: each browser holds one peer
// connection per other participant. Local mic / screen tracks are pushed to
// all peers; the "perfect negotiation" pattern handles offer glare. Signaling
// is relayed through the Socket.IO `signal` event.
export function useWebRTC(
  socketRef: React.RefObject<Socket | null>,
  connected: boolean
) {
  const [micOn, setMicOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [localScreen, setLocalScreen] = useState<MediaStream | null>(null);
  const [remotes, setRemotes] = useState<RemoteMedia[]>([]);
  const [notice, setNotice] = useState("");

  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const names = useRef<Map<string, string>>(new Map());
  const makingOffer = useRef<Map<string, boolean>>(new Map());
  const micStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);

  const flashNotice = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  }, []);

  const updateRemote = useCallback((id: string, stream: MediaStream) => {
    setRemotes((prev) => {
      const others = prev.filter((r) => r.id !== id);
      return [...others, { id, name: names.current.get(id) || "Guest", stream }];
    });
  }, []);

  const dropRemote = useCallback((id: string) => {
    setRemotes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const ensurePc = useCallback(
    (peerId: string) => {
      const existing = pcs.current.get(peerId);
      if (existing) return existing;

      const socket = socketRef.current;
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcs.current.set(peerId, pc);

      // Push any media we're already sending to the new peer.
      [micStream.current, screenStream.current].forEach((s) => {
        s?.getTracks().forEach((t) => pc.addTrack(t, s));
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket?.emit("signal", { to: peerId, data: { candidate: e.candidate } });
        }
      };

      pc.ontrack = (e) => {
        const stream = e.streams[0] ?? new MediaStream([e.track]);
        updateRemote(peerId, stream);
      };

      pc.onnegotiationneeded = async () => {
        try {
          makingOffer.current.set(peerId, true);
          await pc.setLocalDescription();
          socketRef.current?.emit("signal", {
            to: peerId,
            data: { description: pc.localDescription },
          });
        } catch {
          // negotiation will retry on next change
        } finally {
          makingOffer.current.set(peerId, false);
        }
      };

      return pc;
    },
    [socketRef, updateRemote]
  );

  const closePc = useCallback(
    (peerId: string) => {
      pcs.current.get(peerId)?.close();
      pcs.current.delete(peerId);
      makingOffer.current.delete(peerId);
      dropRemote(peerId);
    },
    [dropRemote]
  );

  // Reconcile peer connections against the room roster + handle signaling.
  useEffect(() => {
    const socket = socketRef.current;
    if (!connected || !socket) return;

    const selfId = () => socket.id;

    const onPresence = (participants: Participant[]) => {
      const ids = new Set(participants.map((p) => p.id));
      participants.forEach((p) => {
        names.current.set(p.id, p.name);
        if (p.id !== selfId()) ensurePc(p.id);
      });
      // Tear down peers who left.
      for (const id of pcs.current.keys()) {
        if (!ids.has(id)) closePc(id);
      }
    };

    const onSignal = async ({
      from,
      data,
    }: {
      from: string;
      data: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
    }) => {
      const pc = ensurePc(from);
      // Deterministic, symmetric politeness so exactly one side yields on glare.
      const polite = (selfId() ?? "") > from;
      try {
        if (data.description) {
          const collision =
            data.description.type === "offer" &&
            (makingOffer.current.get(from) || pc.signalingState !== "stable");
          if (collision && !polite) return;
          await pc.setRemoteDescription(data.description);
          if (data.description.type === "offer") {
            await pc.setLocalDescription();
            socket.emit("signal", {
              to: from,
              data: { description: pc.localDescription },
            });
          }
        } else if (data.candidate) {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch {
            // candidate can arrive before remote description; safe to drop
          }
        }
      } catch {
        // ignore malformed signaling
      }
    };

    socket.on("presence", onPresence);
    socket.on("signal", onSignal);

    return () => {
      socket.off("presence", onPresence);
      socket.off("signal", onSignal);
    };
  }, [connected, socketRef, ensurePc, closePc]);

  // Stop all media + connections on unmount.
  useEffect(() => {
    const connections = pcs.current;
    return () => {
      micStream.current?.getTracks().forEach((t) => t.stop());
      screenStream.current?.getTracks().forEach((t) => t.stop());
      connections.forEach((pc) => pc.close());
      connections.clear();
    };
  }, []);

  function addLocalStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      pcs.current.forEach((pc) => pc.addTrack(track, stream));
    });
  }

  function removeLocalStream(stream: MediaStream | null) {
    if (!stream) return;
    const tracks = new Set(stream.getTracks());
    pcs.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && tracks.has(sender.track)) pc.removeTrack(sender);
      });
    });
    stream.getTracks().forEach((t) => t.stop());
  }

  async function toggleMic() {
    if (micOn) {
      removeLocalStream(micStream.current);
      micStream.current = null;
      setMicOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.current = stream;
      addLocalStream(stream);
      setMicOn(true);
    } catch {
      flashNotice("Couldn't access your microphone (permission or device).");
    }
  }

  function stopSharing() {
    removeLocalStream(screenStream.current);
    screenStream.current = null;
    setLocalScreen(null);
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
      screenStream.current = stream;
      stream.getVideoTracks()[0]?.addEventListener("ended", stopSharing);
      addLocalStream(stream);
      setLocalScreen(stream);
      setSharing(true);
    } catch {
      flashNotice("Screen share was cancelled or isn't available here.");
    }
  }

  return {
    micOn,
    sharing,
    localScreen,
    remotes,
    notice,
    toggleMic,
    toggleShare,
  };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type Options = { id: string; role: "host" | "viewer"; name: string };
type Info = { title: string; hostName: string };

// One-to-many live broadcasting over a WebRTC mesh: the broadcaster holds one
// peer connection per viewer and pushes its camera/screen stream out; viewers
// hold a single connection back to the broadcaster and only receive. Signaling
// rides the shared Socket.IO `signal` relay. No SFU — fine for modest rooms.
export function useLive(
  socketRef: React.RefObject<Socket | null>,
  connected: boolean,
  { id, role, name }: Options
) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [live, setLive] = useState(false); // host is broadcasting
  const [ended, setEnded] = useState(false); // viewer: stream ended
  const [viewers, setViewers] = useState(0);
  const [info, setInfo] = useState<Info | null>(null);
  const [notice, setNotice] = useState("");

  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map()); // host: per viewer
  const viewerPc = useRef<RTCPeerConnection | null>(null); // viewer: to host
  const hostIdRef = useRef<string>(""); // viewer: broadcaster socket id
  const localRef = useRef<MediaStream | null>(null);
  const nameRef = useRef(name);
  useEffect(() => {
    nameRef.current = name;
  });

  const flash = useCallback((m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(""), 3500);
  }, []);

  // HOST: open a connection to a viewer and push the live stream.
  const addViewer = useCallback(
    (viewerId: string) => {
      const socket = socketRef.current;
      if (!socket || !localRef.current) return;
      const existing = pcs.current.get(viewerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcs.current.set(viewerId, pc);
      localRef.current.getTracks().forEach((t) => pc.addTrack(t, localRef.current!));
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("signal", { to: viewerId, data: { candidate: e.candidate } });
        }
      };
      pc.onnegotiationneeded = async () => {
        try {
          await pc.setLocalDescription();
          socket.emit("signal", {
            to: viewerId,
            data: { description: pc.localDescription },
          });
        } catch {
          /* retries on next change */
        }
      };
      return pc;
    },
    [socketRef]
  );

  const stopLive = useCallback(() => {
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    setLocalStream(null);
    setLive(false);
    pcs.current.forEach((pc) => pc.close());
    pcs.current.clear();
    socketRef.current?.emit("live:leave");
  }, [socketRef]);

  // HOST: begin broadcasting from camera or screen.
  const goLive = useCallback(
    async (kind: "camera" | "screen", title: string) => {
      try {
        const stream =
          kind === "screen"
            ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
            : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localRef.current = stream;
        setLocalStream(stream);
        setLive(true);
        stream.getVideoTracks()[0]?.addEventListener("ended", () => stopLive());
        socketRef.current?.emit("live:start", {
          id,
          title,
          name: nameRef.current,
        });
      } catch {
        flash("Couldn't start your camera or screen (permission or device).");
      }
    },
    [id, socketRef, flash, stopLive]
  );

  // Wire socket events for the active role.
  useEffect(() => {
    const socket = socketRef.current;
    if (!connected || !socket) return;

    if (role === "host") {
      const onViewerJoin = ({ viewerId }: { viewerId: string }) => addViewer(viewerId);
      const onViewerLeave = ({ viewerId }: { viewerId: string }) => {
        pcs.current.get(viewerId)?.close();
        pcs.current.delete(viewerId);
      };
      const onViewers = (n: number) => setViewers(n);
      const onSignal = async ({
        from,
        data,
      }: {
        from: string;
        data: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
      }) => {
        const pc = pcs.current.get(from);
        if (!pc) return;
        try {
          if (data.description) await pc.setRemoteDescription(data.description);
          else if (data.candidate) await pc.addIceCandidate(data.candidate);
        } catch {
          /* ignore */
        }
      };

      socket.on("live:viewer-join", onViewerJoin);
      socket.on("live:viewer-leave", onViewerLeave);
      socket.on("live:viewers", onViewers);
      socket.on("signal", onSignal);
      return () => {
        socket.off("live:viewer-join", onViewerJoin);
        socket.off("live:viewer-leave", onViewerLeave);
        socket.off("live:viewers", onViewers);
        socket.off("signal", onSignal);
      };
    }

    // Viewer role
    const ensurePc = () => {
      if (viewerPc.current) return viewerPc.current;
      const pc = new RTCPeerConnection(RTC_CONFIG);
      viewerPc.current = pc;
      pc.onicecandidate = (e) => {
        if (e.candidate && hostIdRef.current) {
          socket.emit("signal", {
            to: hostIdRef.current,
            data: { candidate: e.candidate },
          });
        }
      };
      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0] ?? new MediaStream([e.track]));
      };
      return pc;
    };

    const onInfo = (i: Info & { viewers: number }) => {
      setInfo({ title: i.title, hostName: i.hostName });
      setViewers(i.viewers);
    };
    const onViewers = (n: number) => setViewers(n);
    const onEnded = () => {
      setEnded(true);
      viewerPc.current?.close();
      viewerPc.current = null;
      setRemoteStream(null);
    };
    const onSignal = async ({
      from,
      data,
    }: {
      from: string;
      data: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
    }) => {
      hostIdRef.current = from;
      const pc = ensurePc();
      try {
        if (data.description) {
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
            /* candidate may arrive early */
          }
        }
      } catch {
        /* ignore malformed signaling */
      }
    };

    socket.on("live:info", onInfo);
    socket.on("live:viewers", onViewers);
    socket.on("live:ended", onEnded);
    socket.on("signal", onSignal);
    socket.emit("live:join", { id, name: nameRef.current });

    return () => {
      socket.off("live:info", onInfo);
      socket.off("live:viewers", onViewers);
      socket.off("live:ended", onEnded);
      socket.off("signal", onSignal);
      socket.emit("live:leave");
    };
  }, [connected, role, id, socketRef, addViewer]);

  // Stop everything on unmount.
  useEffect(() => {
    const hostPcs = pcs.current;
    return () => {
      localRef.current?.getTracks().forEach((t) => t.stop());
      hostPcs.forEach((pc) => pc.close());
      hostPcs.clear();
      viewerPc.current?.close();
    };
  }, []);

  return {
    localStream,
    remoteStream,
    live,
    ended,
    viewers,
    info,
    notice,
    goLive,
    stopLive,
  };
}

// Custom Next.js server that also runs a Socket.IO realtime backend on the
// same HTTP server/port. Handles watch-party rooms: presence, chat,
// co-watch playback sync, and WebRTC signaling for voice + screen share.
//
// NOTE: server.mjs does not run through the Next.js compiler — keep it plain
// Node ESM.
import { createServer } from "http";
import { createWriteStream, createReadStream, mkdirSync, existsSync, statSync } from "fs";
import { join, normalize } from "path";
import next from "next";
import { Server as SocketServer } from "socket.io";
import { getMessages, addMessage, addUpload } from "./store.mjs";
import { handleApi, userFromRequest } from "./api.mjs";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_UPLOAD = 200 * 1024 * 1024; // 200 MB
const EXT_BY_MIME = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
};
const MIME_BY_EXT = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  mov: "video/quicktime",
};

// Serves uploaded videos with HTTP range support so seeking works. Next.js
// doesn't serve files added to /public after build, so we stream them here.
function serveUpload(req, res) {
  const name = normalize(decodeURIComponent(req.url.slice("/uploads/".length)));
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    res.writeHead(400);
    res.end();
    return;
  }
  const filePath = join(UPLOAD_DIR, name);
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const ext = name.split(".").pop();
  const type = MIME_BY_EXT[ext] || "application/octet-stream";
  const { size } = statSync(filePath);
  const range = req.headers.range;

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : size - 1;
    if (start >= size || end >= size) {
      res.writeHead(416, { "Content-Range": `bytes */${size}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      "Content-Type": type,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
    });
    createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": size,
      "Accept-Ranges": "bytes",
    });
    createReadStream(filePath).pipe(res);
  }
}

// Streams an uploaded video to public/uploads (served statically by Next) and
// records its metadata. Auth-gated; capped in size.
function handleUpload(req, res) {
  const user = userFromRequest(req);
  if (!user) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Sign in to upload." }));
    return;
  }
  const mime = (req.headers["content-type"] || "").split(";")[0];
  const ext = EXT_BY_MIME[mime];
  if (!ext) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unsupported video type." }));
    return;
  }
  const title =
    decodeURIComponent(String(req.headers["x-title"] || "")).slice(0, 120) ||
    "Untitled";

  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  const fileId = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${fileId}.${ext}`;
  const out = createWriteStream(join(UPLOAD_DIR, filename));

  let size = 0;
  let aborted = false;
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > MAX_UPLOAD && !aborted) {
      aborted = true;
      req.destroy();
      out.destroy();
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "File too large (max 200MB)." }));
    }
  });
  req.pipe(out);
  out.on("finish", () => {
    if (aborted) return;
    const upload = addUpload({
      title,
      ownerId: user.id,
      ownerName: user.name,
      src: `/uploads/${filename}`,
      mime,
    });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ upload }));
  });
  out.on("error", () => {
    if (aborted) return;
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Upload failed." }));
  });
}

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, turbopack: dev });
const handle = app.getRequestHandler();

// Live playback state per party room is ephemeral (kept in memory); chat
// history is durable via the file-backed store. Channel keys: `party:<id>`
// for watch-party chat and `dm:<id>` for direct-message conversations.
/** @type {Map<string, { playing: boolean, time: number, at: number }>} */
const playbackByRoom = new Map();

function getPlayback(roomId) {
  let pb = playbackByRoom.get(roomId);
  if (!pb) {
    pb = { playing: true, time: 0, at: Date.now() };
    playbackByRoom.set(roomId, pb);
  }
  return pb;
}

function participantsOf(io, roomId) {
  const set = io.sockets.adapter.rooms.get(roomId);
  if (!set) return [];
  return [...set].map((id) => {
    const s = io.sockets.sockets.get(id);
    return { id, name: s?.data?.name || "Guest" };
  });
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    // Streamed file upload (binary body — bypasses the JSON API).
    if (req.url === "/api/upload" && req.method === "POST") {
      handleUpload(req, res);
      return;
    }
    // Serve uploaded videos with range support.
    if (req.url && req.url.startsWith("/uploads/")) {
      serveUpload(req, res);
      return;
    }
    // JSON API routes are served directly; everything else goes to Next.
    if (req.url && req.url.startsWith("/api/") && !req.url.startsWith("/api/socket")) {
      const handled = await handleApi(req, res);
      if (handled) return;
    }
    handle(req, res);
  });
  const io = new SocketServer(httpServer, {
    cors: { origin: true },
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    socket.on("join", ({ roomId, name }) => {
      if (!roomId) return;
      socket.data.name = String(name || "Guest").slice(0, 40);
      socket.data.roomId = roomId;
      socket.join(roomId);

      // Catch the joiner up on current playback + persisted chat history.
      socket.emit("sync", {
        playback: getPlayback(roomId),
        messages: getMessages(`party:${roomId}`),
        you: { id: socket.id, name: socket.data.name },
      });

      // Update everyone's presence, and tell existing peers a newcomer
      // arrived so they can initiate WebRTC offers.
      io.to(roomId).emit("presence", participantsOf(io, roomId));
      socket.to(roomId).emit("peer-join", {
        id: socket.id,
        name: socket.data.name,
      });
    });

    socket.on("chat", ({ text }) => {
      const roomId = socket.data.roomId;
      if (!roomId || !text) return;
      const msg = {
        id: `${socket.id}-${Date.now()}`,
        fromId: socket.id,
        name: socket.data.name || "Guest",
        text: String(text).slice(0, 2000),
        time: Date.now(),
      };
      addMessage(`party:${roomId}`, msg);
      io.to(roomId).emit("chat", msg);
    });

    // --- Direct messages (shared conversation channels) --------------------
    socket.on("dm:join", ({ channelId }) => {
      if (!channelId) return;
      const room = `dm:${channelId}`;
      socket.join(room);
      socket.emit("dm:history", {
        channelId,
        messages: getMessages(room),
        youId: socket.id,
      });
    });

    socket.on("dm:leave", ({ channelId }) => {
      if (channelId) socket.leave(`dm:${channelId}`);
    });

    socket.on("dm:send", ({ channelId, text, name }) => {
      if (!channelId || !text) return;
      const room = `dm:${channelId}`;
      const msg = {
        id: `${socket.id}-${Date.now()}`,
        fromId: socket.id,
        name: String(name || socket.data.name || "Guest").slice(0, 40),
        text: String(text).slice(0, 2000),
        time: Date.now(),
      };
      addMessage(room, msg);
      io.to(room).emit("dm:message", { channelId, ...msg });
    });

    // Co-watch: broadcast playback changes to everyone else in the room.
    socket.on("playback", ({ playing, time }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const pb = getPlayback(roomId);
      pb.playing = !!playing;
      pb.time = Number(time) || 0;
      pb.at = Date.now();
      socket.to(roomId).emit("playback", pb);
    });

    // WebRTC signaling relay (offers/answers/ICE candidates), targeted 1:1.
    socket.on("signal", ({ to, data }) => {
      if (!to) return;
      io.to(to).emit("signal", { from: socket.id, data });
    });

    function leave() {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      socket.to(roomId).emit("peer-leave", { id: socket.id });
      socket.leave(roomId);
      // Emit presence after this socket has left.
      setTimeout(() => io.to(roomId).emit("presence", participantsOf(io, roomId)), 0);
      // Forget playback state for now-empty rooms.
      const set = io.sockets.adapter.rooms.get(roomId);
      if (!set || set.size === 0) playbackByRoom.delete(roomId);
      socket.data.roomId = null;
    }

    socket.on("leave", leave);
    socket.on("disconnect", leave);
  });

  httpServer.listen(port, () => {
    console.log(
      `> StreamPlus ready on http://localhost:${port} (${dev ? "dev" : "production"})`
    );
  });
});

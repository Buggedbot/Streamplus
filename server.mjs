// Custom Next.js server that also runs a Socket.IO realtime backend on the
// same HTTP server/port. Handles watch-party rooms: presence, chat,
// co-watch playback sync, and WebRTC signaling for voice + screen share.
//
// NOTE: server.mjs does not run through the Next.js compiler — keep it plain
// Node ESM.
import { createServer } from "http";
import next from "next";
import { Server as SocketServer } from "socket.io";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, turbopack: dev });
const handle = app.getRequestHandler();

// In-memory room state (ephemeral — resets on restart). A room holds its
// current playback state and the last chunk of chat so late joiners catch up.
/** @type {Map<string, { playback: { playing: boolean, time: number, at: number }, messages: any[] }>} */
const rooms = new Map();
const CHAT_HISTORY = 50;

function getRoom(roomId) {
  let room = rooms.get(roomId);
  if (!room) {
    room = { playback: { playing: true, time: 0, at: Date.now() }, messages: [] };
    rooms.set(roomId, room);
  }
  return room;
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
  const httpServer = createServer((req, res) => handle(req, res));
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

      const room = getRoom(roomId);

      // Catch the joiner up on current playback + recent chat.
      socket.emit("sync", {
        playback: room.playback,
        messages: room.messages,
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
      const room = getRoom(roomId);
      room.messages.push(msg);
      if (room.messages.length > CHAT_HISTORY) room.messages.shift();
      io.to(roomId).emit("chat", msg);
    });

    // Co-watch: broadcast playback changes to everyone else in the room.
    socket.on("playback", ({ playing, time }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = getRoom(roomId);
      room.playback = {
        playing: !!playing,
        time: Number(time) || 0,
        at: Date.now(),
      };
      socket.to(roomId).emit("playback", room.playback);
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
      // Drop empty rooms.
      const set = io.sockets.adapter.rooms.get(roomId);
      if (!set || set.size === 0) rooms.delete(roomId);
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

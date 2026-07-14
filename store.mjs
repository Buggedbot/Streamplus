// File-backed data store for StreamPlus. Deliberately dependency-free (no
// native modules): everything lives in memory and is flushed to a JSON file on
// a short debounce. Fine for a single-node app; swap for Postgres to scale.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const DATA_DIR = join(process.cwd(), ".data");
const FILE = join(DATA_DIR, "db.json");
const MAX_PER_CHANNEL = 200;
const RETURN_LIMIT = 100;

const empty = () => ({
  messages: {}, // channelId -> message[]
  users: {}, // userId -> user (with passwordHash)
  sessions: {}, // token -> { userId, at }
  comments: {}, // videoId -> comment[]
  follows: {}, // followerId -> { targetId: true }
  likes: {}, // videoId -> { userId: true }
  views: {}, // videoId -> count
  uploads: [], // upload metadata (newest last)
  reports: [], // moderation reports (newest last)
  notifications: {}, // userId -> notification[] (newest last)
  history: {}, // userId -> watched item[] (newest last)
  saved: {}, // userId -> saved item[] (newest last)
  playlists: {}, // playlistId -> { id, ownerId, ownerName, title, items[] }
});

/** @type {ReturnType<typeof empty>} */
let db = empty();
try {
  if (existsSync(FILE)) db = { ...empty(), ...JSON.parse(readFileSync(FILE, "utf8")) };
} catch {
  db = empty();
}

let writeTimer = null;
function persist() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(FILE, JSON.stringify(db));
    } catch {
      // best-effort persistence
    }
  }, 400);
}

function id(prefix) {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

// --- Chat messages ---------------------------------------------------------

export function getMessages(channelId) {
  const list = db.messages[channelId];
  return list ? list.slice(-RETURN_LIMIT) : [];
}

export function addMessage(channelId, msg) {
  const list = db.messages[channelId] || (db.messages[channelId] = []);
  list.push(msg);
  if (list.length > MAX_PER_CHANNEL) list.splice(0, list.length - MAX_PER_CHANNEL);
  persist();
}

// --- Users & auth ----------------------------------------------------------

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(check, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Public shape (never leak passwordHash).
export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    bio: u.bio || "",
    createdAt: u.createdAt,
  };
}

export function findUserByEmail(email) {
  const target = String(email || "").toLowerCase();
  return Object.values(db.users).find((u) => u.email.toLowerCase() === target) || null;
}

export function getUser(userId) {
  return db.users[userId] || null;
}

export function listUsers() {
  return Object.values(db.users).map(publicUser);
}

export function createUser({ name, email, password, role = "viewer" }) {
  if (findUserByEmail(email)) return { error: "Email already registered." };
  const cleanName = String(name || "").trim().slice(0, 40) || "User";
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    return { error: "Enter a valid email." };
  }
  if (!password || String(password).length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  const user = {
    id: id("u"),
    name: cleanName,
    email: cleanEmail,
    passwordHash: hashPassword(String(password)),
    role,
    bio: "",
    createdAt: Date.now(),
  };
  db.users[user.id] = user;
  persist();
  return { user };
}

export function authenticate(email, password) {
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(String(password), user.passwordHash)) {
    return { error: "Incorrect email or password." };
  }
  return { user };
}

// A convenient always-admin demo account (the "Continue with Google" button).
export function demoUser() {
  let user = findUserByEmail("demo@streamplus.app");
  if (!user) {
    user = {
      id: id("u"),
      name: "Demo Admin",
      email: "demo@streamplus.app",
      passwordHash: hashPassword(randomBytes(12).toString("hex")),
      role: "admin",
      bio: "Exploring StreamPlus.",
      createdAt: Date.now(),
    };
    db.users[user.id] = user;
    persist();
  }
  return user;
}

export function updateUser(userId, patch) {
  const u = db.users[userId];
  if (!u) return null;
  if (typeof patch.name === "string") u.name = patch.name.trim().slice(0, 40) || u.name;
  if (typeof patch.bio === "string") u.bio = patch.bio.slice(0, 300);
  if (patch.role === "admin" || patch.role === "viewer") u.role = patch.role;
  persist();
  return publicUser(u);
}

// --- Sessions --------------------------------------------------------------

export function createSession(userId) {
  const token = randomBytes(24).toString("base64url");
  db.sessions[token] = { userId, at: Date.now() };
  persist();
  return token;
}

export function getSessionUser(token) {
  const s = token && db.sessions[token];
  if (!s) return null;
  return db.users[s.userId] || null;
}

export function deleteSession(token) {
  if (token && db.sessions[token]) {
    delete db.sessions[token];
    persist();
  }
}

// --- Comments --------------------------------------------------------------

export function getComments(videoId) {
  return (db.comments[videoId] || []).slice(-RETURN_LIMIT);
}

export function addComment(videoId, { userId, name, text }) {
  const list = db.comments[videoId] || (db.comments[videoId] = []);
  const comment = {
    id: id("c"),
    userId,
    name,
    text: String(text).slice(0, 1000),
    at: Date.now(),
  };
  list.push(comment);
  if (list.length > MAX_PER_CHANNEL) list.splice(0, list.length - MAX_PER_CHANNEL);
  persist();
  return comment;
}

// --- Follows ---------------------------------------------------------------

export function setFollow(followerId, targetId, on) {
  if (!followerId || !targetId || followerId === targetId) return;
  const set = db.follows[followerId] || (db.follows[followerId] = {});
  if (on) set[targetId] = true;
  else delete set[targetId];
  persist();
}

export function isFollowing(followerId, targetId) {
  return Boolean(db.follows[followerId]?.[targetId]);
}

export function followCounts(userId) {
  const following = Object.keys(db.follows[userId] || {}).length;
  let followers = 0;
  for (const set of Object.values(db.follows)) if (set[userId]) followers++;
  return { following, followers };
}

export function getFollowing(userId) {
  return Object.keys(db.follows[userId] || {});
}

// --- Likes -----------------------------------------------------------------

export function toggleLike(videoId, userId) {
  const set = db.likes[videoId] || (db.likes[videoId] = {});
  let liked;
  if (set[userId]) {
    delete set[userId];
    liked = false;
  } else {
    set[userId] = true;
    liked = true;
  }
  persist();
  return { liked, count: Object.keys(set).length };
}

export function likeState(videoId, userId) {
  const set = db.likes[videoId] || {};
  return { liked: Boolean(userId && set[userId]), count: Object.keys(set).length };
}

// --- Views -----------------------------------------------------------------

export function addView(videoId) {
  db.views[videoId] = (db.views[videoId] || 0) + 1;
  persist();
  return db.views[videoId];
}

export function getViews(videoId) {
  return db.views[videoId] || 0;
}

// --- Uploads ---------------------------------------------------------------

export function addUpload(meta) {
  const upload = { id: id("v"), at: Date.now(), ...meta };
  db.uploads.push(upload);
  persist();
  return upload;
}

export function listUploads() {
  return [...db.uploads].reverse();
}

// --- Notifications -----------------------------------------------------------

export function addNotification(userId, { type, text, href }) {
  if (!userId || !db.users[userId]) return;
  const list = db.notifications[userId] || (db.notifications[userId] = []);
  list.push({
    id: id("n"),
    type: String(type || "info"),
    text: String(text || "").slice(0, 200),
    href: String(href || "").slice(0, 200),
    at: Date.now(),
    read: false,
  });
  if (list.length > 100) list.splice(0, list.length - 100);
  persist();
}

export function getNotifications(userId) {
  return [...(db.notifications[userId] || [])].reverse();
}

export function markNotificationsRead(userId) {
  const list = db.notifications[userId];
  if (!list) return;
  for (const n of list) n.read = true;
  persist();
}

// --- Watch history -----------------------------------------------------------

export function addHistory(userId, item) {
  if (!userId) return;
  const list = db.history[userId] || (db.history[userId] = []);
  // De-dupe: re-watching moves the item to the top.
  const i = list.findIndex((x) => x.videoId === item.videoId);
  if (i > -1) list.splice(i, 1);
  list.push({
    videoId: String(item.videoId || "").slice(0, 300),
    title: String(item.title || "Untitled").slice(0, 120),
    src: String(item.src || "").slice(0, 500),
    at: Date.now(),
  });
  if (list.length > 100) list.splice(0, list.length - 100);
  persist();
}

export function getHistory(userId) {
  return [...(db.history[userId] || [])].reverse();
}

// --- Saved / bookmarks ---------------------------------------------------------

export function toggleSaved(userId, item) {
  if (!userId) return { saved: false };
  const list = db.saved[userId] || (db.saved[userId] = []);
  const i = list.findIndex((x) => x.videoId === item.videoId);
  if (i > -1) {
    list.splice(i, 1);
    persist();
    return { saved: false };
  }
  list.push({
    videoId: String(item.videoId || "").slice(0, 300),
    title: String(item.title || "Untitled").slice(0, 120),
    src: String(item.src || "").slice(0, 500),
    at: Date.now(),
  });
  if (list.length > 200) list.splice(0, list.length - 200);
  persist();
  return { saved: true };
}

export function getSaved(userId) {
  return [...(db.saved[userId] || [])].reverse();
}

export function isSaved(userId, videoId) {
  return Boolean((db.saved[userId] || []).find((x) => x.videoId === videoId));
}

// --- Playlists -----------------------------------------------------------------

export function createPlaylist(owner, title) {
  const playlist = {
    id: id("pl"),
    ownerId: owner.id,
    ownerName: owner.name,
    title: String(title || "Untitled playlist").slice(0, 80),
    items: [],
    at: Date.now(),
  };
  db.playlists[playlist.id] = playlist;
  persist();
  return playlist;
}

export function listPlaylists(ownerId) {
  return Object.values(db.playlists)
    .filter((p) => !ownerId || p.ownerId === ownerId)
    .sort((a, b) => b.at - a.at);
}

export function getPlaylist(playlistId) {
  return db.playlists[playlistId] || null;
}

export function addToPlaylist(playlistId, ownerId, item) {
  const p = db.playlists[playlistId];
  if (!p || p.ownerId !== ownerId) return null;
  if (!p.items.find((x) => x.videoId === item.videoId)) {
    p.items.push({
      videoId: String(item.videoId || "").slice(0, 500),
      title: String(item.title || "Untitled").slice(0, 120),
      src: String(item.src || "").slice(0, 500),
      at: Date.now(),
    });
    persist();
  }
  return p;
}

export function removeFromPlaylist(playlistId, ownerId, videoId) {
  const p = db.playlists[playlistId];
  if (!p || p.ownerId !== ownerId) return null;
  p.items = p.items.filter((x) => x.videoId !== videoId);
  persist();
  return p;
}

export function deletePlaylist(playlistId, ownerId) {
  const p = db.playlists[playlistId];
  if (!p || p.ownerId !== ownerId) return false;
  delete db.playlists[playlistId];
  persist();
  return true;
}

// --- Search --------------------------------------------------------------------

export function search(q) {
  const term = String(q || "").trim().toLowerCase();
  if (!term) return { users: [], uploads: [] };
  const users = Object.values(db.users)
    .filter((u) => u.name.toLowerCase().includes(term))
    .slice(0, 10)
    .map(publicUser);
  const uploads = db.uploads
    .filter(
      (u) =>
        u.title.toLowerCase().includes(term) ||
        (u.ownerName || "").toLowerCase().includes(term)
    )
    .slice(-20)
    .reverse();
  return { users, uploads };
}

// --- Moderation reports ----------------------------------------------------

export function addReport({ videoId, caption, reason, reporterId, reporterName }) {
  const report = {
    id: id("r"),
    videoId,
    caption: String(caption || "").slice(0, 200),
    reason: String(reason || "Other").slice(0, 60),
    reporterId,
    reporterName,
    at: Date.now(),
    status: "pending",
  };
  db.reports.push(report);
  if (db.reports.length > 500) db.reports.shift();
  persist();
  return report;
}

export function listReports() {
  return [...db.reports].reverse();
}

export function updateReport(reportId, status) {
  const r = db.reports.find((x) => x.id === reportId);
  if (!r) return null;
  r.status = status === "resolved" || status === "dismissed" ? status : r.status;
  persist();
  return r;
}

// Tiny file-backed message store so chat history (DMs + party rooms) survives
// server restarts. Deliberately dependency-free (no native modules to build):
// messages live in memory and are flushed to a JSON file on a short debounce.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), ".data");
const FILE = join(DATA_DIR, "messages.json");
const MAX_PER_CHANNEL = 200; // cap stored history per channel
const RETURN_LIMIT = 100; // how many recent messages we hand back

/** @type {Record<string, any[]>} */
let data = {};
try {
  if (existsSync(FILE)) data = JSON.parse(readFileSync(FILE, "utf8")) || {};
} catch {
  data = {};
}

let writeTimer = null;
function scheduleWrite() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(FILE, JSON.stringify(data));
    } catch {
      // best-effort persistence; ignore disk errors
    }
  }, 400);
}

export function getMessages(channelId) {
  const list = data[channelId];
  return list ? list.slice(-RETURN_LIMIT) : [];
}

export function addMessage(channelId, msg) {
  const list = data[channelId] || (data[channelId] = []);
  list.push(msg);
  if (list.length > MAX_PER_CHANNEL) {
    list.splice(0, list.length - MAX_PER_CHANNEL);
  }
  scheduleWrite();
}

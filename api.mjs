// JSON HTTP API for StreamPlus, handled by the custom server before Next.js.
// Shares the same file-backed store as the Socket.IO realtime layer.
import * as store from "./store.mjs";

const COOKIE = "sp_session";

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy(); // 1MB cap for JSON
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function json(res, status, body, cookie) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Set-Cookie"] = cookie;
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function sessionCookie(token) {
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  return `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearCookie() {
  return `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

function currentUser(req) {
  const token = parseCookies(req)[COOKIE];
  return store.getSessionUser(token);
}

// Returns true if the request was handled here.
export async function handleApi(req, res) {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  if (!path.startsWith("/api/") || path.startsWith("/api/socket")) return false;

  const method = req.method || "GET";

  try {
    // --- Auth ---
    if (path === "/api/auth/signup" && method === "POST") {
      const { name, email, password } = await readBody(req);
      const result = store.createUser({ name, email, password });
      if (result.error) return json(res, 400, { error: result.error }), true;
      const token = store.createSession(result.user.id);
      return json(res, 200, { user: store.publicUser(result.user) }, sessionCookie(token)), true;
    }

    if (path === "/api/auth/login" && method === "POST") {
      const { email, password } = await readBody(req);
      const result = store.authenticate(email, password);
      if (result.error) return json(res, 401, { error: result.error }), true;
      const token = store.createSession(result.user.id);
      return json(res, 200, { user: store.publicUser(result.user) }, sessionCookie(token)), true;
    }

    if (path === "/api/auth/demo" && method === "POST") {
      const user = store.demoUser();
      const token = store.createSession(user.id);
      return json(res, 200, { user: store.publicUser(user) }, sessionCookie(token)), true;
    }

    if (path === "/api/auth/logout" && method === "POST") {
      store.deleteSession(parseCookies(req)[COOKIE]);
      return json(res, 200, { ok: true }, clearCookie()), true;
    }

    if (path === "/api/auth/me" && method === "GET") {
      return json(res, 200, { user: store.publicUser(currentUser(req)) }), true;
    }

    // --- Profiles & follows ---
    if (path === "/api/people" && method === "GET") {
      const me = currentUser(req);
      const people = store
        .listUsers()
        .filter((u) => !me || u.id !== me.id)
        .map((u) => ({
          ...u,
          counts: store.followCounts(u.id),
          isFollowing: me ? store.isFollowing(me.id, u.id) : false,
        }))
        .slice(0, 50);
      return json(res, 200, { people }), true;
    }

    if (path === "/api/profile" && method === "POST") {
      const me = currentUser(req);
      if (!me) return json(res, 401, { error: "Sign in first." }), true;
      const { name, bio } = await readBody(req);
      const updated = store.updateUser(me.id, { name, bio });
      return json(res, 200, { user: updated }), true;
    }

    if (path.startsWith("/api/users/") && method === "GET") {
      const targetId = path.slice("/api/users/".length);
      const target = store.getUser(targetId);
      if (!target) return json(res, 404, { error: "Not found" }), true;
      const me = currentUser(req);
      return json(res, 200, {
        user: store.publicUser(target),
        counts: store.followCounts(targetId),
        isFollowing: me ? store.isFollowing(me.id, targetId) : false,
      }), true;
    }

    if (path === "/api/follow" && method === "POST") {
      const me = currentUser(req);
      if (!me) return json(res, 401, { error: "Sign in first." }), true;
      const { targetId, on } = await readBody(req);
      store.setFollow(me.id, targetId, !!on);
      return json(res, 200, { counts: store.followCounts(targetId), isFollowing: !!on }), true;
    }

    // --- Comments ---
    if (path === "/api/comments" && method === "GET") {
      const videoId = url.searchParams.get("videoId") || "";
      return json(res, 200, { comments: store.getComments(videoId) }), true;
    }

    if (path === "/api/comments" && method === "POST") {
      const me = currentUser(req);
      if (!me) return json(res, 401, { error: "Sign in to comment." }), true;
      const { videoId, text } = await readBody(req);
      if (!videoId || !String(text || "").trim()) {
        return json(res, 400, { error: "Missing comment." }), true;
      }
      const comment = store.addComment(videoId, {
        userId: me.id,
        name: me.name,
        text: String(text).trim(),
      });
      return json(res, 200, { comment }), true;
    }

    // --- Likes ---
    if (path === "/api/like" && method === "GET") {
      const me = currentUser(req);
      const videoId = url.searchParams.get("videoId") || "";
      return json(res, 200, store.likeState(videoId, me?.id)), true;
    }

    if (path === "/api/like" && method === "POST") {
      const me = currentUser(req);
      if (!me) return json(res, 401, { error: "Sign in to like." }), true;
      const { videoId } = await readBody(req);
      return json(res, 200, store.toggleLike(videoId, me.id)), true;
    }

    // --- Views ---
    if (path === "/api/view" && method === "POST") {
      const { videoId } = await readBody(req);
      if (videoId) store.addView(videoId);
      return json(res, 200, { views: store.getViews(videoId) }), true;
    }

    // --- Admin ---
    if (path === "/api/admin/users" && method === "GET") {
      const me = currentUser(req);
      if (!me || me.role !== "admin") return json(res, 403, { error: "Forbidden" }), true;
      return json(res, 200, { users: store.listUsers() }), true;
    }

    if (path === "/api/admin/users/update" && method === "POST") {
      const me = currentUser(req);
      if (!me || me.role !== "admin") return json(res, 403, { error: "Forbidden" }), true;
      const { userId, role } = await readBody(req);
      const updated = store.updateUser(userId, { role });
      return json(res, 200, { user: updated }), true;
    }

    // Unknown API route.
    return json(res, 404, { error: "Not found" }), true;
  } catch {
    return json(res, 500, { error: "Server error" }), true;
  }
}

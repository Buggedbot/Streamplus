export type Reel = {
  id: string;
  src: string;
  poster: string;
  username: string;
  caption: string;
  likes: number;
  comments: number;
};

// Locally bundled placeholder clips so the reels feed has something to
// scroll through out of the box. Swap these for real content/uploads.
export const REELS: Reel[] = [
  {
    id: "1",
    src: "/videos/reel-1.webm",
    poster: "/posters/reel-1.jpg",
    username: "@creator_one",
    caption: "Sample reel #1 — swap me for real content",
    likes: 1243,
    comments: 87,
  },
  {
    id: "2",
    src: "/videos/reel-2.webm",
    poster: "/posters/reel-2.jpg",
    username: "@creator_two",
    caption: "Sample reel #2 — swap me for real content",
    likes: 892,
    comments: 41,
  },
  {
    id: "3",
    src: "/videos/reel-3.webm",
    poster: "/posters/reel-3.jpg",
    username: "@creator_three",
    caption: "Sample reel #3 — swap me for real content",
    likes: 2310,
    comments: 156,
  },
  {
    id: "4",
    src: "/videos/reel-4.webm",
    poster: "/posters/reel-4.jpg",
    username: "@creator_four",
    caption: "Sample reel #4 — swap me for real content",
    likes: 763,
    comments: 29,
  },
  {
    id: "5",
    src: "/videos/reel-5.webm",
    poster: "/posters/reel-5.jpg",
    username: "@creator_five",
    caption: "Sample reel #5 — swap me for real content",
    likes: 3021,
    comments: 208,
  },
];

export const TRENDING = REELS.map((r) => ({
  id: r.id,
  title: r.caption,
  thumbnail: r.poster,
  src: r.src,
  channel: r.username,
}));

// ---------------------------------------------------------------------------
// Admin dashboard mock data (no backend yet — seed data for the UI).
// ---------------------------------------------------------------------------

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
  status: "active" | "suspended";
  joined: string;
};

export const ADMIN_USERS: AdminUser[] = [
  { id: "u_admin", name: "Demo Admin", email: "admin@streamplus.app", role: "admin", status: "active", joined: "2026-01-04" },
  { id: "u_1", name: "Aisha Khan", email: "aisha@example.com", role: "viewer", status: "active", joined: "2026-02-11" },
  { id: "u_2", name: "Marco Silva", email: "marco@example.com", role: "viewer", status: "active", joined: "2026-03-02" },
  { id: "u_3", name: "Lena Fischer", email: "lena@example.com", role: "viewer", status: "suspended", joined: "2026-03-19" },
  { id: "u_4", name: "Diego Torres", email: "diego@example.com", role: "viewer", status: "active", joined: "2026-04-07" },
  { id: "u_5", name: "Priya Nair", email: "priya@example.com", role: "admin", status: "active", joined: "2026-05-21" },
];

export type Report = {
  id: string;
  reelId: string;
  reelCaption: string;
  reason: string;
  reportedBy: string;
  createdAt: string;
  status: "pending" | "resolved" | "dismissed";
};

export const REPORTS: Report[] = [
  { id: "r_1", reelId: "3", reelCaption: "Sample reel #3 — swap me for real content", reason: "Spam / misleading", reportedBy: "aisha@example.com", createdAt: "2026-06-28", status: "pending" },
  { id: "r_2", reelId: "1", reelCaption: "Sample reel #1 — swap me for real content", reason: "Copyright", reportedBy: "marco@example.com", createdAt: "2026-06-29", status: "pending" },
  { id: "r_3", reelId: "5", reelCaption: "Sample reel #5 — swap me for real content", reason: "Inappropriate content", reportedBy: "diego@example.com", createdAt: "2026-06-30", status: "pending" },
];

// ---------------------------------------------------------------------------
// Chat / friends mock data (frontend-first — no realtime backend yet).
// ---------------------------------------------------------------------------

export type ChatMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
};

export type Conversation = {
  id: string;
  name: string;
  username: string;
  online: boolean;
  messages: ChatMessage[];
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    name: "Aisha Khan",
    username: "@aisha",
    online: true,
    messages: [
      { id: "m1", from: "them", text: "yo did you see the new reel drop?", time: "09:41" },
      { id: "m2", from: "me", text: "not yet! link?", time: "09:42" },
      { id: "m3", from: "them", text: "starting a watch party tonight, join?", time: "09:42" },
    ],
  },
  {
    id: "c2",
    name: "Marco Silva",
    username: "@marco",
    online: true,
    messages: [
      { id: "m1", from: "me", text: "that stream yesterday was 🔥", time: "Yesterday" },
      { id: "m2", from: "them", text: "right?? we should co-watch the finale", time: "Yesterday" },
    ],
  },
  {
    id: "c3",
    name: "Priya Nair",
    username: "@priya",
    online: false,
    messages: [
      { id: "m1", from: "them", text: "sent you the playlist", time: "Mon" },
      { id: "m2", from: "me", text: "got it, thanks!", time: "Mon" },
    ],
  },
  {
    id: "c4",
    name: "Diego Torres",
    username: "@diego",
    online: false,
    messages: [
      { id: "m1", from: "them", text: "gg on the party earlier", time: "Sun" },
    ],
  },
];

// Canned replies so the demo chat feels alive without a backend.
export const AUTO_REPLIES = [
  "haha for real 😄",
  "okay let's do it",
  "sending the link now",
  "brb grabbing snacks 🍿",
  "that's wild",
  "yeah I'm in!",
];

// ---------------------------------------------------------------------------
// Watch party.
// ---------------------------------------------------------------------------

// Default clip a fresh party room plays until someone loads another link.
export const DEFAULT_PARTY_VIDEO = REELS[0].src;

export const ANALYTICS = {
  totals: [
    { label: "Total views", value: "1.2M", delta: "+12.4%" },
    { label: "Active users", value: "48.3K", delta: "+6.1%" },
    { label: "Reels uploaded", value: "3,204", delta: "+3.8%" },
    { label: "Avg. watch time", value: "4m 12s", delta: "+0.9%" },
  ],
  // 7-day view counts (in thousands) for a simple sparkline/bar chart.
  weeklyViews: [120, 145, 132, 168, 190, 176, 205],
  topContent: REELS.slice(0, 4).map((r, i) => ({
    id: r.id,
    title: r.caption,
    channel: r.username,
    views: [412000, 331000, 289000, 214000][i],
  })),
};

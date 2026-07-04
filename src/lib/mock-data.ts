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
// Chat directory. Conversations are shared realtime channels backed by the
// Socket.IO server; this list is just the contact roster shown in the UI.
// ---------------------------------------------------------------------------

export type Conversation = {
  id: string;
  name: string;
  username: string;
  online: boolean;
};

export const CONVERSATIONS: Conversation[] = [
  { id: "c1", name: "Aisha Khan", username: "@aisha", online: true },
  { id: "c2", name: "Marco Silva", username: "@marco", online: true },
  { id: "c3", name: "Priya Nair", username: "@priya", online: false },
  { id: "c4", name: "Diego Torres", username: "@diego", online: false },
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

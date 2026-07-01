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

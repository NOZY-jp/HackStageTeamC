import type { Message } from "../../types";

/**
 * リア友サーバーの写真だけの投稿（#177）。本文は空で、既存の `public/discord-like/clips` を添付する。
 * 台本（本文あり）とは別に持ち、`servers.ts` でチャンネルごとに結合する。
 */
const names = [
  "clip-0204-8.png",
  "clip-0211-1.png",
  "clip-0214-9.png",
  "clip-0312-2.png",
  "clip-0312-3.png",
  "clip-0405-4.png",
] as const;
const authors = ["taku", "miyu", "jun", "nao", "riku", "yuuto"] as const;

const days = [
  "2026-01-18",
  "2026-02-11",
  "2026-03-21",
  "2026-04-12",
  "2026-05-09",
  "2026-06-20",
  "2026-07-11",
  "2026-08-15",
  "2026-09-12",
  "2026-10-10",
  "2026-01-25",
  "2026-02-22",
  "2026-03-29",
  "2026-04-19",
  "2026-05-24",
  "2026-06-28",
  "2026-07-26",
  "2026-08-23",
  "2026-09-20",
  "2026-10-18",
];

const photo = (index: number, channelId: string): Message => {
  const day = days[Math.floor(index / 3) % days.length];
  const hour = 12 + (index % 2);
  const minute = (index * 11 + 5) % 60;
  const name = names[index % names.length];
  return {
    id: `${channelId}-photo-${String(index + 1).padStart(3, "0")}`,
    channelId,
    authorId: authors[index % authors.length],
    sentAt: `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:23+09:00`,
    body: "",
    attachments: [
      {
        id: `${channelId}-photo-att-${String(index + 1).padStart(3, "0")}`,
        name,
        kind: "image",
        sizeLabel: "1.8 MB",
      },
    ],
  };
};

const build = (channelId: string, from: number, count: number): Message[] =>
  Array.from({ length: count }, (_, i) => photo(from + i, channelId));

export const friendPhotos: Record<string, Message[]> = {
  "friend-chat": build("friend-chat", 0, 30),
  "friend-memory": build("friend-memory", 30, 30),
};

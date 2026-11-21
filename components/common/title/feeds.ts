import { readdirSync } from "node:fs";
import path from "node:path";
import { channelMessages } from "@/lib/discord-like/data/messages";
import { users as discordUsers } from "@/lib/discord-like/data/users";
import { fbPosts } from "@/lib/facebook-like/data/posts";
import { fbUsers } from "@/lib/facebook-like/data/users";
import { twitterPosts, twitterUsers } from "@/lib/twitter-like/data/twitter";

/**
 * タイトル画面の背景に流す、3つの SNS の投稿（ぼかして流すだけの飾り）。
 * サーバーで少しだけ選んで渡す（データ全体をブラウザに送らない）。
 * ぼかしても答えが透けないよう、本名・物語で届く文言・本人（talkup の u40）の投稿は入れない。
 */

export type FeedItem = { id: string; name: string; color: string; text: string; avatar: string };
export type TitleFeed = {
  platform: "discord" | "twixer" | "talkup";
  label: string;
  items: FeedItem[];
};

const PER_COLUMN = 18;

/**
 * アイコンにする画像。写真・イラスト・アニメ調（public/title/avatars）と、ゲームの中の画像を混ぜる。
 * 背景の飾りなので、いろいろな画像が並ぶよう、投稿ごとに散らして当てる
 */
const EXTRA_AVATARS = [
  "/discord-like/clips/clip-0204-8.webp",
  "/discord-like/clips/clip-0529-6.webp",
  "/discord-like/clips/clip-0819-1.webp",
  "/discord-like/clips/clip-1019-5.webp",
  "/note-like/covers/coffee.svg",
  "/note-like/covers/headset.svg",
  "/note-like/covers/moon-castle.svg",
  "/talkup/seaside-sunset.svg",
  "/twitter-like/photo-02.svg",
];

function avatarPool(): string[] {
  const dir = path.join(process.cwd(), "public", "title", "avatars");
  const files = readdirSync(dir)
    .filter((file) => /\.(svg|jpe?g|png|webp)$/.test(file))
    .sort()
    .map((file) => `/title/avatars/${file}`);
  return [...files, ...EXTRA_AVATARS];
}

function hash(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return value;
}
const HIDDEN_WORDS = [
  "服部",
  "由比",
  "小路",
  "花音",
  "尾崎",
  "海斗",
  "杉浦",
  "ゆい",
  "ゆっちゃん",
  "住所",
  "本名",
];
const HIDDEN_AUTHORS = new Set(["u40"]);

const safe = (text: string) =>
  text.trim() !== "" && !HIDDEN_WORDS.some((word) => text.includes(word));
const short = (text: string) => (text.length > 80 ? `${text.slice(0, 80)}…` : text);

/** 先頭から均等に間引いて、count 件にする（同じ人ばかり並ばないように） */
function spread<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const step = items.length / count;
  return Array.from({ length: count }, (_, index) => items[Math.floor(index * step)]);
}

export function buildTitleFeeds(): TitleFeed[] {
  const pool = avatarPool();
  const avatarOf = (name: string) => pool[hash(name) % pool.length];
  const discordById = new Map(discordUsers.map((user) => [user.id, user]));
  const discord = spread(
    Object.values(channelMessages)
      .flat()
      .filter((message) => safe(message.body)),
    PER_COLUMN,
  ).flatMap((message) => {
    const user = discordById.get(message.authorId);
    return user
      ? [
          {
            id: message.id,
            name: user.displayName,
            color: user.avatarColor,
            text: short(message.body),
            avatar: avatarOf(`${user.displayName}:${message.id}`),
          },
        ]
      : [];
  });

  const twixerById = new Map(twitterUsers.map((user) => [user.id, user]));
  const twixer = spread(
    twitterPosts.filter((post) => safe(post.body)),
    PER_COLUMN,
  ).flatMap((post) => {
    const user = twixerById.get(post.authorId);
    return user
      ? [
          {
            id: post.id,
            name: user.displayName,
            color: user.avatarColor,
            text: short(post.body),
            avatar: avatarOf(`${user.displayName}:${post.id}`),
          },
        ]
      : [];
  });

  const talkupById = new Map(fbUsers.map((user) => [user.id, user]));
  const talkup = spread(
    fbPosts.filter((post) => !HIDDEN_AUTHORS.has(post.authorId) && safe(post.body)),
    PER_COLUMN,
  ).flatMap((post) => {
    const user = talkupById.get(post.authorId);
    return user && safe(user.displayName)
      ? [
          {
            id: post.id,
            name: user.displayName,
            color: user.avatarColor,
            text: short(post.body),
            avatar: avatarOf(`${user.displayName}:${post.id}`),
          },
        ]
      : [];
  });

  return [
    { platform: "discord", label: "Discord", items: discord },
    { platform: "twixer", label: "Twixer", items: twixer },
    { platform: "talkup", label: "talkup", items: talkup },
  ];
}

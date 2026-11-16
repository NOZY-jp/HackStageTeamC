import type { Article, Creator } from "./types";

/**
 * 仮データ。脚本（docs/）が固まるまでの置き場で、人物設定や真相を確定させるものではない。
 * 日時だけは docs/ダイアログ.md の時系列（2026-11-21 に連絡が途絶える）と矛盾しないようにしてある。
 */
export const creators: Creator[] = [
  {
    id: "mai_yoru",
    displayName: "mai",
    bio: "夜にゲームをして、朝に後悔する会社員。日記と、好きなものの話。",
    avatarColor: "#7c9cbf",
    followerCount: 48,
    followingCount: 31,
  },
  {
    id: "tsukimi_guild",
    displayName: "月見亭ギルド通信",
    bio: "のんびり勢ギルド「月見亭」の活動記録。週末レイドと雑談が主食です。",
    avatarColor: "#c9973f",
    followerCount: 212,
    followingCount: 64,
  },
  {
    id: "kado_coffee",
    displayName: "かどの珈琲",
    bio: "駅前の小さな喫茶店。豆のこと、店のこと、たまに猫のこと。",
    avatarColor: "#8a6a55",
    followerCount: 1034,
    followingCount: 12,
  },
];

/** 記事は脚本が固まってから入れる。 */
export const articles: Article[] = [];

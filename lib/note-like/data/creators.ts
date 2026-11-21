import { LEAF_CREATOR_ID } from "../../blog-migration/articles";
import type { Creator } from "../types";

/** 書き手。脚本（docs/）が固まるまでの仮データ。 */
export const creators: Creator[] = [
  {
    // 旧ブログ（ぽちブロ）からの引っ越し先。
    id: LEAF_CREATOR_ID,
    displayName: "MaiMai",
    bio: "夜にゲームをして、朝に後悔する会社員。日記と、好きなものの話。",
    avatar: "/note-like/avatars/mai.svg",
    avatarColor: "#7c9cbf",
  },
  {
    id: "tsukimi_guild",
    displayName: "月見亭ギルド通信",
    bio: "のんびり勢ギルド「月見亭」の活動記録。週末レイドと雑談が主食です。",
    avatar: "/note-like/avatars/tsukimi-guild.svg",
    avatarColor: "#c9973f",
  },
  {
    id: "kado_coffee",
    displayName: "かどの珈琲",
    bio: "駅前の小さな喫茶店。豆のこと、店のこと、たまに猫のこと。",
    avatar: "/note-like/avatars/kado-coffee.svg",
    avatarColor: "#8a6a55",
  },
];

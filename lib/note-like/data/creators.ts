import { LEAF_CREATOR_ID } from "../../blog-migration/articles";
import type { Creator } from "../types";

/** 書き手。脚本（docs/）が固まるまでの仮データ。 */
export const creators: Creator[] = [
  {
    // 旧ブログ（ぽちブロ）からの引っ越し先。
    id: LEAF_CREATOR_ID,
    displayName: "MaiMai",
    bio: "夜にゲームをして、朝に後悔する会社員。昔は「でんでん」名義で攻略日記を書いていました。",
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
  {
    id: "silver_frame",
    displayName: "銀枠",
    bio: "フィルムの残りと、写ると思っていなかったもの。",
    avatarColor: "#546d83",
  },
  {
    id: "workbench_38",
    displayName: "作業台38",
    bio: "家の家具を直す。切り落としたほうの木も取っておく。",
    avatarColor: "#756146",
  },
  {
    id: "late_supper",
    displayName: "遅い晩ごはん",
    bio: "晩の台所と、翌朝の取り分。",
    avatarColor: "#85584c",
  },
];

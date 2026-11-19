import type { Creator } from "../types";

/**
 * 書き手。作品世界（Google Docs「HackStageTeamC」のシナリオ）に合わせたダミーデータ。
 *
 * shiro_hunt は「彼女」が高校生のころ使っていたアカウント。調査では、プレイヤーがここから
 * 過去の活動名「しろ」と、閉鎖した元のブログ名「しろの狩猟記録」を得る。
 * 活動名・ブログ名は Twitter（Twixer）側の古いアカウントと揃える必要がある（未調整の仮の名前）。
 *
 * ほかの2人は彼女と無関係なモンハン系の書き手で、検索したときの紛れ役。
 */
export const creators: Creator[] = [
  {
    id: "shiro_hunt",
    displayName: "しろ",
    bio: "モンハンの攻略と日記。双剣とライトボウガン。高校生。2018年から書いていたブログ「しろの狩猟記録」から引っ越してきました。",
    avatar: "/note-like/avatars/shiro.svg",
    avatarColor: "#9cc4e4",
  },
  {
    id: "kanade_gunlance",
    displayName: "奏｜ガンランス一筋",
    bio: "ガンランスしか担がない人。砲撃と竜撃砲の話ばかりします。",
    avatar: "/note-like/avatars/kanade.svg",
    avatarColor: "#3b4a6b",
  },
  {
    id: "yakusou_memo",
    displayName: "薬草メモ",
    bio: "平日は会社員、夜と週末だけハンター。社会人でも置いていかれない遊び方を書いています。",
    avatar: "/note-like/avatars/yakusou.svg",
    avatarColor: "#6f9a6a",
  },
];

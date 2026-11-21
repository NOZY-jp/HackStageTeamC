import type { Guild } from "../../types";

/** リア友サーバー（#132）。テキスト3・ボイス1。かのんは入れない（面識なしの設定）。 */
export const friend: Guild = {
  id: "friend",
  urlId: "1187002356428841051",
  name: "いつメン",
  iconColor: "#c9973f",
  initials: "IT",
  categories: [
    { id: "friend-cat-text", guildId: "friend", name: "テキストチャンネル", position: 1 },
    { id: "friend-cat-voice", guildId: "friend", name: "ボイスチャンネル", position: 2 },
  ],
  channels: [
    {
      id: "friend-chat",
      urlId: "1187002356428841052",
      guildId: "friend",
      name: "雑談",
      kind: "text",
      topic: "いつもの雑談",
      categoryId: "friend-cat-text",
      position: 1,
    },
    {
      id: "friend-plan",
      urlId: "1187002356428841053",
      guildId: "friend",
      name: "予定",
      kind: "text",
      topic: "遊ぶ予定",
      categoryId: "friend-cat-text",
      position: 2,
    },
    {
      id: "friend-memory",
      urlId: "1187002356428841054",
      guildId: "friend",
      name: "思い出",
      kind: "text",
      topic: "昔の写真と話",
      categoryId: "friend-cat-text",
      position: 3,
    },
    {
      id: "friend-vc",
      urlId: "1187002356428841055",
      guildId: "friend",
      name: "通話",
      kind: "voice",
      categoryId: "friend-cat-voice",
      position: 4,
    },
  ],
};

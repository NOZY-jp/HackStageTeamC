import type { Category, Channel, Guild } from "../types";

/**
 * サーバーは1つ。ID は #3 の URL（/servers/s1/channels/c1）と揃えてある。
 */
const categories: Category[] = [
  { id: "cat-text", guildId: "s1", name: "テキストチャンネル", position: 1 },
  { id: "cat-voice", guildId: "s1", name: "ボイスチャンネル", position: 2 },
];

const channels: Channel[] = [
  {
    id: "c1",
    guildId: "s1",
    name: "一般",
    kind: "text",
    topic: "チーム全体の連絡",
    categoryId: "cat-text",
    position: 1,
  },
  {
    id: "c2",
    guildId: "s1",
    name: "雑談",
    kind: "text",
    categoryId: "cat-text",
    position: 2,
    unreadCount: 3,
  },
  {
    id: "v1",
    guildId: "s1",
    name: "ボイス 1",
    kind: "voice",
    topic: "作業通話用",
    categoryId: "cat-voice",
    position: 3,
  },
];

export const guilds: Guild[] = [
  {
    id: "s1",
    name: "HackStage Team C",
    iconColor: "#5865f2",
    initials: "HC",
    categories,
    channels,
  },
];

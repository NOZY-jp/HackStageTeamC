import type { User } from "../types";

/** モンハンコミュニティのメンバー。hal が自分（ログインユーザー）。 */
export const users: User[] = [
  {
    id: "hal",
    displayName: "Hal",
    handle: "skill5hot1202",
    avatarColor: "#5865f2",
    status: "online",
  },
  {
    id: "maimai",
    displayName: "MaiMai",
    handle: "maimai1110",
    avatarColor: "#eb459e",
    status: "online",
  },
  {
    id: "gunlance",
    displayName: "ガンランス太郎",
    handle: "gunlance_taro",
    avatarColor: "#57f287",
    status: "dnd",
  },
  {
    id: "mina",
    displayName: "双剣ミナ",
    handle: "db_mina",
    avatarColor: "#fee75c",
    status: "online",
  },
  {
    id: "haruka",
    displayName: "弓ハルカ",
    handle: "bow_haruka",
    avatarColor: "#9b59b6",
    status: "idle",
  },
  {
    id: "slime",
    displayName: "太刀すらいむ",
    handle: "tachi_slime",
    avatarColor: "#e67e22",
    status: "online",
  },
  {
    id: "jijii",
    displayName: "笛じじい",
    handle: "hh_jijii",
    avatarColor: "#1abc9c",
    status: "offline",
  },
  {
    id: "master",
    displayName: "集会所マスター",
    handle: "shuukai_master",
    avatarColor: "#95a5a6",
    status: "online",
  },
];

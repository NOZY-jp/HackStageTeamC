import type { User } from "../types";
import {
  HAL_HANDLE,
  HAL_NAME,
  KAI_DISPLAY_NAME,
  KAI_HANDLE,
  KANON_HANDLE,
  KANON_NAME,
  MAIMAI_HANDLE,
  MAIMAI_NAME,
  OLD_BLOG_ARCHIVE_URL,
  OLD_DISPLAY_NAME,
  OLD_HANDLE,
} from "./names";

/** モンハンコミュニティのメンバー。hal が自分（ログインユーザー）。 */
export const users: User[] = [
  {
    id: "hal",
    displayName: HAL_NAME,
    handle: HAL_HANDLE,
    avatarColor: "#5865f2",
    status: "online",
  },
  {
    id: "maimai",
    displayName: MAIMAI_NAME,
    handle: MAIMAI_HANDLE,
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
  {
    id: "kai",
    displayName: KAI_DISPLAY_NAME,
    handle: KAI_HANDLE,
    avatarColor: "#3ba55d",
    status: "online",
  },
  {
    // 昔のゲーム内ハンドルと一致する旧垢。ずっとオフラインのまま（現在のハンドルとは別）。
    id: "denden",
    displayName: OLD_DISPLAY_NAME,
    handle: OLD_HANDLE,
    avatarColor: "#7289da",
    status: "offline",
    profileUrl: OLD_BLOG_ARCHIVE_URL,
  },
  {
    // 憶測: Discord のハンドルは未提供（Twixer の @kanon__dayo に寄せた仮決め）
    id: "kanon",
    displayName: KANON_NAME,
    handle: KANON_HANDLE,
    avatarColor: "#f47fff",
    status: "offline",
  },
];

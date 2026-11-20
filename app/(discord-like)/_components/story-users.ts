import type { CharacterId } from "@/lib/story";
import { SELF_USER_ID } from "./self-user";

/** 物語の人物 → Discord のユーザー（lib/discord-like/data/users.ts の id）。物語のメッセージ・通話を出すときに使う */
export const STORY_USERS: Record<CharacterId, string> = {
  ryo: SELF_USER_ID,
  maimai: "maimai",
  kai: "kai",
  kanon: "kanon",
};

import type { User } from "../types";

/** ユーザーは5人。status は省略時「不明」として扱う。 */
export const users: User[] = [
  {
    id: "u1",
    displayName: "あおい",
    handle: "aoi",
    avatarColor: "#5865f2",
    status: "online",
  },
  {
    id: "u2",
    displayName: "かえで",
    handle: "kaede",
    avatarColor: "#eb459e",
    status: "idle",
  },
  {
    id: "u3",
    displayName: "りく",
    handle: "riku",
    avatarColor: "#57f287",
    status: "dnd",
  },
  {
    id: "u4",
    displayName: "そら",
    handle: "sora",
    avatarColor: "#fee75c",
    status: "offline",
  },
  {
    id: "u5",
    displayName: "HackStage Bot",
    handle: "hackstage-bot",
    avatarColor: "#9b59b6",
    bot: true,
  },
];

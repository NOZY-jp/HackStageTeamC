import type { User } from "../../types";
import { acquaintances } from "./acquaintances";
import { backgroundUsers } from "./background";
import { named } from "./named";

export { acquaintances } from "./acquaintances";
export { backgroundUsers, buildBackgroundUsers } from "./background";
export { named } from "./named";

/** 全ユーザー（ネームド11＋アンネームド39＋背景350＝400人）。並びは固定。 */
export const users: User[] = [...named, ...acquaintances, ...backgroundUsers];

/** 発言する人（50人）: ネームド10（`denden` を除く）＋アンネームド39＋`denden`。 */
export const SPEAKING_USER_IDS: string[] = [
  ...named.filter((user) => user.id !== "denden").map((user) => user.id),
  ...acquaintances.map((user) => user.id),
  "denden",
];

/** いまオンラインの人（30人）。 */
export const ONLINE_USER_IDS: string[] = users
  .filter((user) => user.status === "online")
  .map((user) => user.id);

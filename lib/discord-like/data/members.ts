import { FRIEND_MEMBERS, UNIV_MEMBERS } from "./guilds/members";
import { backgroundUsers } from "./people/background";
import { named } from "./people/named";

/**
 * サーバーごとのメンバー（#163）。人数は docs/discord/03-people.md §5 の表が正本。
 * 発言者の並びは `data/guilds/members.ts` の定数を使い、発言者が必ずそのサーバーの
 * メンバーであることをデータで保証する（生成器は #154 で廃止）。
 */
const backgroundIds = (from: number, count: number): string[] =>
  backgroundUsers.slice(from, from + count).map((user) => user.id);

/** mhc のメンバー = 発言者9人＋旧垢＋背景 */
export const MHC_MEMBER_IDS: string[] = [
  ...named.filter((user) => user.id !== "kanon").map((user) => user.id),
  ...backgroundIds(0, 250),
];

/** univ のメンバー = hal＋同級生18・先輩6・後輩9＋背景 */
export const UNIV_MEMBER_IDS: string[] = [...UNIV_MEMBERS, ...backgroundIds(250, 86)];

/** friend のメンバー = hal＋リア友6＋背景 */
export const FRIEND_MEMBER_IDS: string[] = [...FRIEND_MEMBERS, ...backgroundIds(336, 13)];

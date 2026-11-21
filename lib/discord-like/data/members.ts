import { FRIEND_MEMBERS, UNIV_MEMBERS } from "../generators/servers";
import { BACKGROUND_SPLIT, backgroundUsers } from "./people/background";
import { named } from "./people/named";

/**
 * サーバーごとのメンバー（#163）。人数は docs/discord/03-people.md §5 の表が正本
 * （mhc 260・univ 120・friend 20。延べ人数なので、人は複数サーバーに入れる）。
 *
 * - 発言者の並びはメッセージ生成器と同じ定数（UNIV_MEMBERS / FRIEND_MEMBERS）を使い、
 *   「発言する人は必ずそのサーバーのメンバー」をデータで保証する
 * - 背景アカウントは先頭から mhc → univ → friend の順に決定的に割り振る。
 *   区切りは `BACKGROUND_SPLIT`（people/background.ts。名前の振り分けと同じ区切り）
 *   余った背景（および、どのサーバーにも入れない人）はどこにも出ない
 */
const backgroundIds = (from: number, count: number): string[] =>
  backgroundUsers.slice(from, from + count).map((user) => user.id);

/**
 * mhc のメンバー（260人）= 発言する9人＋ずっとオフラインの旧垢 `denden`＋背景250。
 * `kanon` はどのサーバーにも入れない（リョウと面識なし。friend にも入れない決まりと同じ扱い）。
 */
export const MHC_MEMBER_IDS: string[] = [
  ...named.filter((user) => user.id !== "kanon").map((user) => user.id),
  ...backgroundIds(0, BACKGROUND_SPLIT.mhc),
];

/** univ のメンバー（120人）= hal＋学科の同級生18・先輩6・後輩9＋背景86。 */
export const UNIV_MEMBER_IDS: string[] = [
  ...UNIV_MEMBERS,
  ...backgroundIds(BACKGROUND_SPLIT.mhc, BACKGROUND_SPLIT.univ),
];

/** friend のメンバー（20人）= hal＋リア友6＋背景13。 */
export const FRIEND_MEMBER_IDS: string[] = [
  ...FRIEND_MEMBERS,
  ...backgroundIds(BACKGROUND_SPLIT.mhc + BACKGROUND_SPLIT.univ, BACKGROUND_SPLIT.friend),
];

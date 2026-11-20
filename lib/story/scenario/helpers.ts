import type { Beat, Channel, CharacterId, Line } from "../types";

/**
 * 台本を書くための短い書き方。
 *   say("kai", "……")      … その人の発言
 *   note("……")             … 地の文・システムの表示（「翌日」「通話を開始しました」など）
 *   todo("kai", "進捗を聞く") … 資料に文面がまだ無い行の仮置き。確認画面で目立ち、テストで数える
 *   dm("kai")               … Discord の DM
 *   monologue               … リョウの独り言
 */
export const say = (from: CharacterId, text: string): Line => ({ from, text });
export const note = (text: string): Line => ({ from: "system", text });
export const todo = (from: CharacterId, hint: string): Line => ({
  from,
  text: `（未定：${hint}）`,
  todo: true,
});
export const dm = (withCharacter: CharacterId): Channel => ({
  kind: "discord-dm",
  with: withCharacter,
});
export const monologue: Channel = { kind: "monologue" };

/** 場面を書く。型の補完を効かせるためだけの関数 */
export const beat = (value: Beat): Beat => value;

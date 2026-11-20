export { characters, FORBIDDEN_WORDS, getCharacter, nicknames } from "./characters";
export * from "./engine";
export { EXTRA_FLAGS, FLAG_IDS, type FlagId } from "./flags";
export { beats } from "./scenario";
export { getStep, STEP_IDS, type Step, type StepId, steps } from "./steps";
export type * from "./types";

/** 章の名前（シナリオの章立て） */
export const CHAPTER_TITLES: Record<number, string> = {
  1: "プロローグ",
  2: "失踪",
  3: "助言",
  4: "痕跡",
  5: "欠片",
  6: "現実",
};

/** フラグの説明（段階のフラグは段階の要約） */
export { flagLabel } from "./labels";

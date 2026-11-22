export {
  characters,
  FORBIDDEN_WORDS,
  getCharacter,
  nicknames,
  speakerLabel,
} from "./characters";
export * from "./engine";
export { EXTRA_FLAGS, FLAG_IDS, type FlagId } from "./flags";
export { isAtPlace, isWithinPlace, PLACES, type Place, type PlaceId } from "./places";
export * from "./playback";
export { beats } from "./scenario";
export {
  OLD_BLOG_ID,
  SITE_IDS,
  SITES,
  type Site,
  type SiteId,
  siteAt,
  unlockedSites,
} from "./sites";
export * from "./stage";
export { getStep, STEP_IDS, type Step, type StepId, steps } from "./steps";
export {
  clearState,
  fromLegacy,
  LEGACY_STORAGE_KEYS,
  loadState,
  parseState,
  readChoices,
  STORAGE_KEY,
  saveState,
} from "./storage";
export type * from "./types";

/** 章の名前（シナリオの章立て） */
export const CHAPTER_TITLES: Record<number, string> = {
  1: "序章",
  2: "失踪",
  3: "助言",
  4: "痕跡",
  5: "欠片",
  6: "現実",
};

/** フラグの説明（段階のフラグは段階の要約） */
export { flagLabel } from "./labels";

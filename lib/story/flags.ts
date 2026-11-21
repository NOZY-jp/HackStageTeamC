import { STEP_IDS, type StepId } from "./steps";

/**
 * フラグ。謎解きの各段階（steps.ts）に着いたことと、場面の進み具合を表す。
 * 段階以外のフラグはここに足す（型で打ち間違いを防ぐ）。
 */
export const EXTRA_FLAGS = {
  started: "ゲームを始めた",
  leftCall: "序章の通話を終えた",
  askedKai: "カイに相談した",
  foundBff: "BFFのアカウントを見つけた",
  /** カイに「でんちゃんと呼ぶと喜ぶ」と教わった（#120・#76 順序9） */
  kaiToldDenchan: "カイに『でんちゃん』を教わった",
  /** 玄関で「でんちゃん」と呼んだ（誤認結末の条件） */
  usedDenchan: "「でんちゃん」と呼んだ",
  /** 玄関で表示名のまま呼んだ（誤認しない側） */
  calledByName: "表示名で呼んだ",
} as const;

export type FlagId = StepId | keyof typeof EXTRA_FLAGS;

export const FLAG_IDS: FlagId[] = [...(Object.keys(EXTRA_FLAGS) as FlagId[]), ...STEP_IDS];

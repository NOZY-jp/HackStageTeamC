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
} as const;

export type FlagId = StepId | keyof typeof EXTRA_FLAGS;

export const FLAG_IDS: FlagId[] = [...(Object.keys(EXTRA_FLAGS) as FlagId[]), ...STEP_IDS];

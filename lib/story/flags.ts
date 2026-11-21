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
  toldKaiOldAccount: "旧アカウント発見をカイに報告した",
  reachedBadEnd: "悪い結末（逮捕エンド）に到達した",
  "te01-kai-nickname": "カイとのDMで「でんちゃん」の助言を見つけた",
  "te02-kai-joined-mhc": "モンハンコミュニティにカイが参加していることに気づいた",
  "te03-talkup-kai-follower": "Talkupでまいまいがフォロバしていないカイのアカウントを見つけた",
  "te04-kanon-stalker-post": "かのんのTwixerでストーカー被害を匂わせる投稿を見つけた",
  choseTrueEnd: "カイの正体を突き止め、誤解を解く道を選んだ",
  choseBadEnd: "分岐で直接家へ向かう選択をした",
  choseBadEndAgain: "調べ直し後の分岐で直接家へ向かう選択をした",
  reconsiderBranch: "分岐の判断をやり直すことにした",
  /** カイに「でんちゃんと呼ぶと喜ぶ」と教わった（#120・#76 順序9） */
  kaiToldDenchan: "カイに『でんちゃん』を教わった",
  /** 玄関で「でんちゃん」と呼んだ（誤認結末の条件） */
  usedDenchan: "「でんちゃん」と呼んだ",
  /** 玄関で表示名のまま呼んだ（誤認しない側） */
  calledByName: "表示名で呼んだ",
} as const;

export type FlagId = StepId | keyof typeof EXTRA_FLAGS;

export const FLAG_IDS: FlagId[] = [...(Object.keys(EXTRA_FLAGS) as FlagId[]), ...STEP_IDS];

/**
 * シナリオを進める仕組みの型（試作）。
 * 値は cast.ts / flags.ts / script.ts に置き、ロジックは lib/story/engine.ts の純関数だけにする。
 */

/** 登場人物のID。台帳（cast.ts）に居るIDだけを使う。 */
export type CastId = "ryo" | "mai" | "kai" | "kanon";

/** 進行フラグのID。定義は flags.ts に置く（台本は文字列で参照する）。 */
export type FlagId = string;

/** 台本の章。物語の進行順。 */
export type Chapter = "助言" | "痕跡" | "欠片" | "現実";

/** 人物のアカウント（プラットフォームごとに名前が違う）。 */
export type CastAccount = {
  platform: "pochiblo" | "leaf" | "twixer" | "discord";
  handle: string;
  /** そのサービスでの表示名（分かっている場合だけ） */
  displayName?: string;
};

/**
 * 人物の台帳。本名は置かない（作中でも本文には出さない方針）。
 * 表示名はこのファイルの displayName だけを正とする。
 */
export type CastMember = {
  id: CastId;
  displayName: string;
  /** 作中で使う呼称（例: まいまい）。無ければ displayName を使う */
  nickname?: string;
  /** 一人称 */
  pronoun: string;
  accounts: CastAccount[];
  /** 昔の呼び方と、それを知っている人（人物ID）・根拠 */
  oldNames: { name: string; knownBy: CastId[]; source?: string }[];
  /** この人物の役割（確認画面用の一言） */
  role: string;
};

/** プレイヤーが見つけたこと（フラグ）の定義。 */
export type StoryFlag = {
  id: FlagId;
  label: string;
  description: string;
};

/** きっかけ（各画面に置く部品が起こす出来事）。 */
export type Trigger = {
  id: string;
  label: string;
  description: string;
  setsFlags: FlagId[];
};

/** 台詞。 */
export type SceneLine = {
  speakerId: CastId;
  text: string;
};

/** プレイヤーの選択肢。選ぶとフラグが立つことがある。 */
export type SceneChoice = {
  id: string;
  label: string;
  setsFlags: FlagId[];
  /** このフラグがそろうまで選べない（選択肢単位のゲート） */
  requires?: FlagId[];
  /** この選択肢で物語が終わるときの結末文（確認画面に最終状態として出す） */
  ending?: string;
  /** 選んだ直後に続く台詞（話者が反応する1〜2行） */
  replyLines?: SceneLine[];
  /**
   * この選択肢で場面を完了するか（既定 true）。
   * false は「寄り道」で、選んでも場面は終わらず、ほかの選択肢を選び直せる。
   */
  completesScene?: boolean;
};

/** 場面。要求フラグがそろい、まだ終わっていなければ始まる。 */
export type Scene = {
  id: string;
  chapter: Chapter;
  title: string;
  requires: FlagId[];
  lines: SceneLine[];
  choices: SceneChoice[];
  /** 場面が終わったら立つフラグ */
  completesFlags: FlagId[];
  /** この場面で物語が終わるときの結末文（選択肢なしで完了する場面用） */
  ending?: string;
};

/** 進行状態。localStorage に保存する。 */
export type Progress = {
  flags: FlagId[];
  completedScenes: string[];
  /** 場面ID → 選んだ選択肢ID */
  choices: Record<string, string>;
};

/** 組み立て直した会話の1場面分。 */
export type TranscriptEntry = {
  sceneId: string;
  chapter: Chapter;
  title: string;
  lines: SceneLine[];
  choice?: { id: string; label: string };
  /** 選んだ直後に続く台詞 */
  replyLines?: SceneLine[];
};

import type { FlagId } from "../flags";
import type { PlaceId } from "../places";
import type { CharacterId } from "../types";
import type { BackgroundId, Expression, ImageRef } from "./assets";
import type { CustomCueName } from "./custom";
import type {
  Duration,
  EffectName,
  FrameName,
  MotionRef,
  Position,
  TintName,
  TransitionName,
} from "./presets";

/**
 * 場面の命令（キュー）。場面はこれを上から順に実行する。
 * 文章（text）で止まり、プレイヤーが読んで進めると次の文章まで残りの命令を実行する。
 */

/** 文章。text が空でも動く（最後に文章を入れる前提） */
export type TextCue = {
  type: "text";
  frame: FrameName;
  /** 話す人（地の文・場面転換・システム表示では無し） */
  from?: CharacterId;
  text: string;
  /** 話している人の立ち絵の表情を、この行で変える */
  expression?: Expression;
  /** 文面が未定であることの印（確認画面で目立たせる） */
  todo?: true;
};

/** 背景を変える。画像の一覧の名前か、色 */
export type BackgroundCue = {
  type: "background";
  image: BackgroundId | { color: string };
  transition?: TransitionName;
  duration?: Duration;
};

/** 立ち絵・小物を出す。id は場面の中での呼び名（あとで動かす・消すときに使う） */
export type ShowCue = {
  type: "show";
  id: string;
  image: ImageRef;
  at?: Position;
  /** 高さ（画面の高さに対する％）。立ち絵は 80、小物は 30 が目安 */
  height?: number;
  /** 重なり順（大きいほど手前） */
  z?: number;
  flip?: boolean;
  enter?: MotionRef;
};

/** 出している立ち絵の画像を差し替える（表情を変えるなど） */
export type ChangeCue = { type: "change"; id: string; image: ImageRef; duration?: Duration };

/** 位置を移す */
export type MoveCue = {
  type: "move";
  id: string;
  to: Position;
  duration?: Duration;
  /** 動き終わるまで次の命令を待つ */
  wait?: boolean;
};

/** 動かす。target は立ち絵・小物の id か、画面全体 "screen" */
export type AnimateCue = { type: "animate"; target: string; motion: MotionRef; wait?: boolean };

/** 消す */
export type HideCue = { type: "hide"; id: string; exit?: MotionRef };

/** 立ち絵・小物を全部消す */
export type ClearCue = { type: "clear" };

/** 画面全体の効果 */
export type EffectCue = {
  type: "effect";
  name: EffectName;
  duration?: Duration;
  /** effect: "tint" のときの色（名前か色の値） */
  tint?: TintName | string;
  wait?: boolean;
};

/** 待つ */
export type WaitCue = { type: "wait"; duration: Duration };

/** カスタム演出（自由に書いた React の部品）。wait: true なら部品が終わるまで待つ */
export type CustomCue = {
  type: "custom";
  name: CustomCueName;
  props?: Record<string, unknown>;
  wait?: boolean;
};

/** フラグを立てる（場面の途中で） */
export type FlagCue = { type: "flag"; flag: FlagId };

/** 文章の窓を隠す・出す（演出だけを見せたいとき）。次の文章で自動的に出る */
export type WindowCue = { type: "window"; visible: boolean };

/**
 * SNS のチャットにメッセージを流す（例: Discord の DM）。流れたメッセージは、そのプラットフォームの画面に出る。
 * channel は「プラットフォーム:チャンネルの ID」（例: "discord:dm-maimai"）。
 * at はメッセージの日時（作中の時刻。日本時間の ISO 8601）。
 */
export type ChatCue = {
  type: "chat";
  channel: ChatChannel;
  from: CharacterId;
  text: string;
  at: string;
  wait?: Duration;
};

/** チャットを流せる場所。足すときは、そのプラットフォームで受け取る処理も足す（docs/story.md） */
export const CHAT_CHANNELS = {
  "discord:dm-maimai": { label: "Discord：MaiMai との DM", place: "discord:dm-maimai" },
  "discord:dm-kai": { label: "Discord：χ との DM", place: "discord:dm-kai" },
} as const satisfies Record<string, { label: string; place: PlaceId }>;
export type ChatChannel = keyof typeof CHAT_CHANNELS;

/**
 * SNS の通話（例: Discord のボイスチャンネル）の様子を変える。入る・出る・ミュート・ミュート解除。
 * 通話の枠（call）の行が出ているあいだは、その人が「話している」表示になる。
 * 通話の様子は、その場面を流しているあいだだけ画面に出る（場面が終わったら消える）。
 */
export type VoiceCue = {
  type: "voice";
  channel: VoiceChannel;
  who: CharacterId;
  action: VoiceAction;
};

export const VOICE_ACTIONS = {
  join: "入る",
  leave: "出る",
  mute: "ミュート",
  unmute: "ミュート解除",
} as const;
export type VoiceAction = keyof typeof VOICE_ACTIONS;

/** 通話の場所。足すときは、そのプラットフォームで受け取る処理も足す（docs/story.md） */
export const VOICE_CHANNELS = {
  "discord:mhc-vc-3": {
    label: "Discord：深夜の集会（ボイスチャンネル）",
    place: "discord:vc-night",
  },
} as const satisfies Record<string, { label: string; place: PlaceId }>;
export type VoiceChannel = keyof typeof VOICE_CHANNELS;

export type StageCue =
  | BackgroundCue
  | ShowCue
  | ChangeCue
  | MoveCue
  | AnimateCue
  | HideCue
  | ClearCue
  | EffectCue
  | WaitCue
  | CustomCue
  | VoiceCue
  | FlagCue
  | WindowCue
  | ChatCue;

export type Cue = TextCue | StageCue;

// ---- 書くための短い書き方（場面ファイルではこれを使う） ----

type TextOptions = { expression?: Expression };

/** 対面の会話 */
export const say = (from: CharacterId, text = "", options: TextOptions = {}): TextCue => ({
  type: "text",
  frame: "talk",
  from,
  text,
  ...options,
});
/** 通話 */
export const call = (from: CharacterId, text = ""): TextCue => ({
  type: "text",
  frame: "call",
  from,
  text,
});
/** 心の声（独り言）。基本はリョウ */
export const think = (text = "", from: CharacterId = "ryo"): TextCue => ({
  type: "text",
  frame: "think",
  from,
  text,
});
/** 地の文 */
export const narrate = (text = ""): TextCue => ({ type: "text", frame: "narration", text });
/** 場面転換（「翌日」「第二章：失踪」など） */
export const title = (text = ""): TextCue => ({ type: "text", frame: "title", text });
/** システム表示（「通話を開始しました」など） */
export const system = (text = ""): TextCue => ({ type: "text", frame: "system", text });
/** 文面が未定の行の仮置き。frame と話す人を決めておき、文面はあとで入れる */
export const todo = (cue: TextCue, hint: string): TextCue => ({
  ...cue,
  text: cue.text || `（未定：${hint}）`,
  todo: true,
});

export const background = (
  image: BackgroundCue["image"],
  options: Omit<BackgroundCue, "type" | "image"> = {},
): BackgroundCue => ({ type: "background", image, ...options });
export const show = (
  id: string,
  image: ImageRef,
  options: Omit<ShowCue, "type" | "id" | "image"> = {},
): ShowCue => ({ type: "show", id, image, ...options });
export const change = (id: string, image: ImageRef, duration?: Duration): ChangeCue => ({
  type: "change",
  id,
  image,
  duration,
});
export const move = (
  id: string,
  to: Position,
  options: Omit<MoveCue, "type" | "id" | "to"> = {},
): MoveCue => ({ type: "move", id, to, ...options });
export const animate = (
  target: string,
  motion: MotionRef,
  options: { wait?: boolean } = {},
): AnimateCue => ({
  type: "animate",
  target,
  motion,
  ...options,
});
export const hide = (id: string, exit?: MotionRef): HideCue => ({ type: "hide", id, exit });
export const clear = (): ClearCue => ({ type: "clear" });
export const effect = (
  name: EffectName,
  options: Omit<EffectCue, "type" | "name"> = {},
): EffectCue => ({
  type: "effect",
  name,
  ...options,
});
export const wait = (duration: Duration): WaitCue => ({ type: "wait", duration });
export const custom = (
  name: CustomCueName,
  props?: Record<string, unknown>,
  options: { wait?: boolean } = {},
): CustomCue => ({ type: "custom", name, props, ...options });
export const flag = (id: FlagId): FlagCue => ({ type: "flag", flag: id });
/** SNS のチャットにメッセージを流す（Discord の DM など） */
export const chat = (
  channel: ChatChannel,
  from: CharacterId,
  text: string,
  at: string,
  options: { wait?: Duration } = {},
): ChatCue => ({ type: "chat", channel, from, text, at, ...options });
/** 通話の様子を変える（Discord のボイスチャンネルなど） */
export const voice = (channel: VoiceChannel, who: CharacterId, action: VoiceAction): VoiceCue => ({
  type: "voice",
  channel,
  who,
  action,
});
/** 文章の窓を隠す（次の文章で自動的に出る） */
export const hideWindow = (): WindowCue => ({ type: "window", visible: false });
/** 文章の窓を出す */
export const showWindow = (): WindowCue => ({ type: "window", visible: true });

/** 人物の立ち絵の指定の短い書き方 */
export const portrait = (character: CharacterId, expression?: Expression): ImageRef => ({
  character,
  expression,
});

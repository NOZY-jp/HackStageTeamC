/**
 * 統一する演出の型（docs/story.md「統一するもの」）。場面からは名前で指定する。
 * 足りないときは場面の中で自由に書いてよい（キーフレーム・座標）。
 * 同じ自由な演出を2回以上使ったら、ここに名前を付けて足す。
 */

/** 時間（ミリ秒）。場面から数値で書いてもよいが、なるべくこの名前を使う */
export const DURATIONS = { instant: 0, fast: 200, normal: 400, slow: 800, slower: 1400 } as const;
export type DurationName = keyof typeof DURATIONS;
export type Duration = DurationName | number;

export function toMs(duration: Duration | undefined, fallback: DurationName = "normal"): number {
  if (duration === undefined) {
    return DURATIONS[fallback];
  }
  return typeof duration === "number" ? duration : DURATIONS[duration];
}

/** 緩急。Motion の ease にそのまま渡す */
export const EASINGS = {
  standard: [0.4, 0, 0.2, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
  linear: "linear",
} as const;
export type EasingName = keyof typeof EASINGS;

/**
 * 立ち絵・小物の位置。x・y は画面に対する％（x: 横の中心、y: 下端）。
 * 場面からは名前でも、{ x, y } の数値でも指定できる。
 */
export const POSITIONS = {
  "far-left": { x: 12, y: 100 },
  left: { x: 28, y: 100 },
  center: { x: 50, y: 100 },
  right: { x: 72, y: 100 },
  "far-right": { x: 88, y: 100 },
} as const;
export type PositionName = keyof typeof POSITIONS;
export type Position = PositionName | { x: number; y: number };

export function toPoint(position: Position | undefined): { x: number; y: number } {
  if (position === undefined) {
    return POSITIONS.center;
  }
  return typeof position === "string" ? POSITIONS[position] : position;
}

/** Motion のキーフレームと時間の指定（自由に書くときもこの形） */
export type Keyframes = Record<string, number | string | (number | string)[]>;
export type MotionSpec = {
  keyframes: Keyframes;
  duration?: Duration;
  ease?: EasingName;
  /** 繰り返し回数（Infinity で繰り返し続ける） */
  repeat?: number;
};

/**
 * 動きの型。立ち絵・小物・画面全体（"screen"）に使える。
 * enter（出るとき）・exit（消えるとき）・emphasis（その場で目立たせる）に分けている。
 */
export const MOTIONS = {
  // 出るとき
  "fade-in": { keyframes: { opacity: [0, 1] }, duration: "normal", ease: "enter" },
  "slide-in-left": {
    keyframes: { opacity: [0, 1], x: ["-12vw", "0vw"] },
    duration: "normal",
    ease: "enter",
  },
  "slide-in-right": {
    keyframes: { opacity: [0, 1], x: ["12vw", "0vw"] },
    duration: "normal",
    ease: "enter",
  },
  "slide-in-up": {
    keyframes: { opacity: [0, 1], y: ["8vh", "0vh"] },
    duration: "normal",
    ease: "enter",
  },
  "pop-in": {
    keyframes: { opacity: [0, 1], scale: [0.8, 1.05, 1] },
    duration: "normal",
    ease: "enter",
  },
  "zoom-in": { keyframes: { opacity: [0, 1], scale: [1.3, 1] }, duration: "slow", ease: "enter" },
  // 消えるとき
  "fade-out": { keyframes: { opacity: [1, 0] }, duration: "normal", ease: "exit" },
  "slide-out-left": {
    keyframes: { opacity: [1, 0], x: ["0vw", "-12vw"] },
    duration: "normal",
    ease: "exit",
  },
  "slide-out-right": {
    keyframes: { opacity: [1, 0], x: ["0vw", "12vw"] },
    duration: "normal",
    ease: "exit",
  },
  "slide-out-down": {
    keyframes: { opacity: [1, 0], y: ["0vh", "8vh"] },
    duration: "normal",
    ease: "exit",
  },
  // その場で目立たせる
  shake: { keyframes: { x: [0, -10, 10, -6, 6, 0] }, duration: "normal", ease: "linear" },
  nod: { keyframes: { y: [0, 8, 0] }, duration: "fast", ease: "standard" },
  jump: { keyframes: { y: [0, -24, 0] }, duration: "normal", ease: "standard" },
  pulse: { keyframes: { scale: [1, 1.06, 1] }, duration: "normal", ease: "standard" },
  tremble: { keyframes: { x: [0, -2, 2, -2, 2, 0] }, duration: "slow", ease: "linear" },
  float: { keyframes: { y: [0, -6, 0] }, duration: "slower", ease: "standard", repeat: Infinity },
  spin: { keyframes: { rotate: [0, 360] }, duration: "slow", ease: "standard" },
} as const satisfies Record<string, MotionSpec>;
export type MotionName = keyof typeof MOTIONS;
/** 名前の動き、または自由に書いた動き */
export type MotionRef = MotionName | MotionSpec;

export function toMotion(motion: MotionRef): MotionSpec {
  return typeof motion === "string" ? MOTIONS[motion] : motion;
}

/** 背景の切り替え方 */
export const TRANSITIONS = [
  "cut",
  "fade",
  "black",
  "white",
  "slide-left",
  "slide-right",
  "zoom",
] as const;
export type TransitionName = (typeof TRANSITIONS)[number];

/** 画面全体の効果 */
export const EFFECTS = {
  /** 画面を揺らす */
  shake: "画面を揺らす",
  /** 一瞬白く光る */
  flash: "一瞬白く光る",
  /** 暗転する（明けるまで暗いまま） */
  "fade-to-black": "暗転する",
  /** 暗転から明ける */
  "fade-from-black": "暗転から明ける",
  /** 色を重ねる（夜・回想など）。clear-tint で外す */
  tint: "色を重ねる",
  "clear-tint": "重ねた色を外す",
} as const;
export type EffectName = keyof typeof EFFECTS;

/** 色を重ねるときの型 */
export const TINTS = {
  night: "rgb(20 30 80 / 0.35)",
  sepia: "rgb(120 80 30 / 0.3)",
  memory: "rgb(255 255 255 / 0.25)",
  danger: "rgb(160 20 20 / 0.25)",
} as const;
export type TintName = keyof typeof TINTS;

/**
 * 文章の枠。見た目は app/globals.css の .sw-window[data-frame=...] で統一する。
 * - talk: 対面の会話（名前つき） / call: 通話（名前つき・通話中の印） / think: 心の声
 * - narration: 地の文（名前なし） / title: 場面転換（窓の中央に大きく） / system: 小さな通知
 */
export const FRAMES = {
  talk: "対面の会話",
  call: "通話",
  think: "心の声（独り言）",
  narration: "地の文",
  title: "場面転換",
  system: "システム表示",
} as const;
export type FrameName = keyof typeof FRAMES;

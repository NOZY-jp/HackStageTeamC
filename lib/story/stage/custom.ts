/**
 * カスタム演出の名前（自由にするもの）。部品は components/common/story/stage/custom-cues.tsx に登録する。
 * ここに名前を足すと、部品の登録漏れが型エラーになる。
 */
export const CUSTOM_CUES = {
  /** スマホの画面を大きく映し、メッセージを順に出す */
  "phone-screen": "スマホの画面を映す",
  /** 画面いっぱいに文字を出す（章の扉など） */
  "big-text": "画面いっぱいの文字",
} as const;
export type CustomCueName = keyof typeof CUSTOM_CUES;

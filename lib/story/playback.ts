import { transcript } from "./engine";
import type { Beat, Line, StoryState } from "./types";

/**
 * 台本をゲーム画面に出すときの決まりごと（純関数）。画面の部品は components/common/story にある。
 */

/** 進み方。クリック: 押すたびに次の行 / オート: 自動で次の行 / スキップ: すばやく流す */
export type PlaybackMode = "click" | "auto" | "skip";

/** 文字送りの速さ。instant は文字送りをしない */
export type TextSpeed = "slow" | "normal" | "fast" | "instant";

export type PlaybackSettings = {
  mode: PlaybackMode;
  speed: TextSpeed;
};

export const DEFAULT_PLAYBACK: PlaybackSettings = { mode: "click", speed: "normal" };

export const PLAYBACK_MODE_LABELS: Record<PlaybackMode, string> = {
  click: "クリック",
  auto: "オート",
  skip: "スキップ",
};

export const TEXT_SPEED_LABELS: Record<TextSpeed, string> = {
  slow: "遅い",
  normal: "普通",
  fast: "速い",
  instant: "一瞬",
};

const CHAR_INTERVAL_MS: Record<TextSpeed, number> = {
  slow: 70,
  normal: 40,
  fast: 18,
  instant: 0,
};

/** 1文字を出す間隔（ms）。0 なら一度に全文を出す */
export function charIntervalMs(settings: PlaybackSettings, reducedMotion = false): number {
  if (reducedMotion || settings.mode === "skip") {
    return 0;
  }
  return CHAR_INTERVAL_MS[settings.speed];
}

/** スキップのときの1行あたりの待ち（ms） */
export const SKIP_LINE_MS = 120;

/**
 * 全文が出てから次の行へ進むまでの待ち（ms）。クリックのときは自動で進まないので null。
 * オートは「読む時間」として文字数に比例させる（短い行でも最低限は待つ）。
 */
export function autoAdvanceMs(settings: PlaybackSettings, text: string): number | null {
  if (settings.mode === "click") {
    return null;
  }
  if (settings.mode === "skip") {
    return SKIP_LINE_MS;
  }
  const length = [...text].length;
  return Math.min(6000, 1200 + length * 60);
}

/** 文字送りで、経過時間までに出ている文字数 */
export function visibleChars(text: string, elapsedMs: number, intervalMs: number): number {
  const length = [...text].length;
  if (intervalMs <= 0) {
    return length;
  }
  return Math.min(length, Math.floor(elapsedMs / intervalMs));
}

/** 文字数（サロゲートペアを1文字と数える）で先頭を切り出す */
export function sliceChars(text: string, count: number): string {
  return [...text].slice(0, count).join("");
}

/**
 * 「いまやること」。最後に終わった場面のうち memo を持つものの memo。
 * 次に流れる場面があるあいだは窓が開いているので出さない（undefined）。
 */
export function currentMemo(
  state: StoryState,
  upcoming: Beat | undefined,
  beats?: Beat[],
): string | undefined {
  if (upcoming) {
    return undefined;
  }
  const history = beats ? transcript(state, beats) : transcript(state);
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const memo = history[index].beat.memo;
    if (memo) {
      return memo;
    }
  }
  return undefined;
}

/** ログ（流れた場面の文章を、終わった順に） */
export function windowLog(
  state: StoryState,
  beats?: Beat[],
): { beatId: string; chapter: number; lines: Line[] }[] {
  const history = beats ? transcript(state, beats) : transcript(state);
  return history.map(({ beat, lines }) => ({ beatId: beat.id, chapter: beat.chapter, lines }));
}

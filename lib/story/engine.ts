import type { FlagId } from "./flags";
import { beats as allBeats } from "./scenario";
import type { Beat, Line, StoryState } from "./types";

/**
 * 進行のロジック。すべて純関数で、状態を受け取って新しい状態を返す（画面や保存は別）。
 */

export const initialState: StoryState = { flags: [], completed: [], choices: {} };

const unique = <T>(values: T[]): T[] => [...new Set(values)];

/** フラグを立てる。もう立っていれば何もしない */
export function setFlag(state: StoryState, flag: FlagId): StoryState {
  return state.flags.includes(flag) ? state : { ...state, flags: [...state.flags, flag] };
}

/** 場面が始まるのに足りないもの（フラグと、先に終わっているべき場面） */
export function missingFor(state: StoryState, beat: Beat): { flags: FlagId[]; beats: string[] } {
  return {
    flags: beat.when.filter((flag) => !state.flags.includes(flag)),
    beats: (beat.after ?? []).filter((id) => !state.completed.includes(id)),
  };
}

/** 始められる場面（条件がそろい、まだ終わっていない）。台本の並び順 */
export function availableBeats(state: StoryState, beats: Beat[] = allBeats): Beat[] {
  return beats.filter((beat) => {
    if (state.completed.includes(beat.id)) {
      return false;
    }
    const missing = missingFor(state, beat);
    return missing.flags.length === 0 && missing.beats.length === 0;
  });
}

/** 次に始まる場面 */
export function nextBeat(state: StoryState, beats: Beat[] = allBeats): Beat | undefined {
  return availableBeats(state, beats)[0];
}

/**
 * 場面を終える。選択肢がある場面は choiceId が要る。
 * 場面の sets と、選んだ選択肢の sets のフラグを立てる。
 */
export function completeBeat(state: StoryState, beat: Beat, choiceId?: string): StoryState {
  const choice = beat.choices?.find((candidate) => candidate.id === choiceId);
  if (beat.choices && beat.choices.length > 0 && !choice) {
    throw new Error(`場面 ${beat.id} には選択肢が必要です`);
  }
  return {
    flags: unique([...state.flags, ...(beat.sets ?? []), ...(choice?.sets ?? [])]),
    completed: [...state.completed, beat.id],
    choices: choice ? { ...state.choices, [beat.id]: choice.id } : state.choices,
  };
}

/** 場面の会話を、選んだ選択肢まで含めて1列にする */
export function linesOf(beat: Beat, choiceId?: string): Line[] {
  const choice = beat.choices?.find((candidate) => candidate.id === choiceId);
  return [
    ...beat.lines,
    ...(choice ? [{ from: "ryo" as const, text: choice.label }, ...(choice.reply ?? [])] : []),
  ];
}

/** 終わった場面から会話の履歴を組み立て直す（保存しているのは状態だけ） */
export function transcript(
  state: StoryState,
  beats: Beat[] = allBeats,
): { beat: Beat; lines: Line[] }[] {
  return state.completed.flatMap((beatId) => {
    const beat = beats.find((candidate) => candidate.id === beatId);
    return beat ? [{ beat, lines: linesOf(beat, state.choices[beatId]) }] : [];
  });
}

/** いまの章（終わった場面のうち最も進んだ章。始めていなければ 1） */
export function currentChapter(state: StoryState, beats: Beat[] = allBeats): number {
  const chapters = transcript(state, beats).map(({ beat }) => beat.chapter);
  return chapters.length > 0 ? Math.max(...chapters) : 1;
}

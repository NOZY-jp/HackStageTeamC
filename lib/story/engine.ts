import type { FlagId } from "./flags";
import { beats as allBeats } from "./scenario";
import type { Beat, Choice, Line, StoryState } from "./types";

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

/** この場面でもう選んだ選択肢（選んだ順） */
export function chosenIn(state: StoryState, beatId: string): string[] {
  return state.choices[beatId] ?? [];
}

/** いま出す選択肢（条件のフラグがそろっていて、まだ選んでいない寄り道を除いたもの） */
export function remainingChoices(state: StoryState, beat: Beat): Choice[] {
  const chosen = chosenIn(state, beat.id);
  return (beat.choices ?? []).filter(
    (choice) =>
      !chosen.includes(choice.id) &&
      (choice.requires ?? []).every((flag) => state.flags.includes(flag)),
  );
}

/**
 * 選択肢を選ぶ。選んだ順に残し、選択肢の sets のフラグを立てる。
 * 寄り道（completes: false）なら場面は続き、そうでなければ場面を終える。
 */
export function choose(state: StoryState, beat: Beat, choiceId: string): StoryState {
  const choice = remainingChoices(state, beat).find((candidate) => candidate.id === choiceId);
  if (!choice) {
    throw new Error(`場面 ${beat.id} で選択肢 ${choiceId} は選べません`);
  }
  const next: StoryState = {
    ...state,
    flags: unique([...state.flags, ...(choice.sets ?? [])]),
    choices: { ...state.choices, [beat.id]: [...chosenIn(state, beat.id), choice.id] },
  };
  return choice.completes === false ? next : finish(next, beat);
}

/** 場面を終えたことにする（場面の sets のフラグを立てる） */
function finish(state: StoryState, beat: Beat): StoryState {
  return {
    ...state,
    flags: unique([...state.flags, ...(beat.sets ?? [])]),
    completed: [...state.completed, beat.id],
  };
}

/**
 * 場面を終える。選択肢がある場面は choiceId が要る（choose と同じ。寄り道を渡すと場面は続く）。
 */
export function completeBeat(state: StoryState, beat: Beat, choiceId?: string): StoryState {
  if (choiceId !== undefined) {
    return choose(state, beat, choiceId);
  }
  if (remainingChoices(state, beat).length > 0) {
    throw new Error(`場面 ${beat.id} には選択肢が必要です`);
  }
  return finish(state, beat);
}

/** 場面の会話を、選んだ選択肢（寄り道も、選んだ順に）まで含めて1列にする */
export function linesOf(beat: Beat, chosen: readonly string[] = []): Line[] {
  return [
    ...beat.lines,
    ...chosen.flatMap((choiceId) => {
      const choice = beat.choices?.find((candidate) => candidate.id === choiceId);
      return choice ? [{ from: "ryo" as const, text: choice.label }, ...(choice.reply ?? [])] : [];
    }),
  ];
}

/** 終わった場面から会話の履歴を組み立て直す（保存しているのは状態だけ） */
export function transcript(
  state: StoryState,
  beats: Beat[] = allBeats,
): { beat: Beat; lines: Line[] }[] {
  return state.completed.flatMap((beatId) => {
    const beat = beats.find((candidate) => candidate.id === beatId);
    return beat ? [{ beat, lines: linesOf(beat, chosenIn(state, beatId)) }] : [];
  });
}

/** いまの章（終わった場面のうち最も進んだ章。始めていなければ 1） */
export function currentChapter(state: StoryState, beats: Beat[] = allBeats): number {
  const chapters = transcript(state, beats).map(({ beat }) => beat.chapter);
  return chapters.length > 0 ? Math.max(...chapters) : 1;
}

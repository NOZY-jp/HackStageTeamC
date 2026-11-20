import type { FlagId } from "./flags";
import { isAtPlace } from "./places";
import { beats as allBeats } from "./scenario";
import { CHAT_CHANNELS, type Cue, say } from "./stage/cues";
import { type ChatMessage, chatsOf, textsOf } from "./stage/runner";
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
    if (beat.previewOnly || state.completed.includes(beat.id)) {
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

/** 場面の命令を、選んだ選択肢（リョウの発言と、その後の命令）まで含めて1列にする */
export function cuesOf(beat: Beat, choiceId?: string): Cue[] {
  const choice = beat.choices?.find((candidate) => candidate.id === choiceId);
  return [...beat.script, ...(choice ? [say("ryo", choice.label), ...(choice.reply ?? [])] : [])];
}

/** 場面の文章（ログに残る行）。選んだ選択肢まで含める */
export function linesOf(beat: Beat, choiceId?: string): Line[] {
  return textsOf(cuesOf(beat, choiceId));
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

/** 終わった場面で流したチャット（終わった順）。各プラットフォームの画面はこれを過去のデータに足して出す */
export function completedChats(state: StoryState, beats: Beat[] = allBeats): ChatMessage[] {
  return state.completed.flatMap((beatId) => {
    const beat = beats.find((candidate) => candidate.id === beatId);
    return beat ? chatsOf(beat.id, cuesOf(beat, state.choices[beatId])) : [];
  });
}

/**
 * まだ見ていない、ほかの人からのチャット（「DM が届きました」の知らせに使う）。
 * いまその画面を開いているものは、見ているので除く。
 */
export function unreadChats(
  chats: ChatMessage[],
  seen: readonly string[],
  pathname: string,
): ChatMessage[] {
  return chats.filter(
    (chat) =>
      chat.from !== "ryo" &&
      !seen.includes(chat.id) &&
      !isAtPlace(pathname, CHAT_CHANNELS[chat.channel].place),
  );
}

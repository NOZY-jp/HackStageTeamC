import type { FlagId } from "../flags";
import type { CharacterId } from "../types";
import type { BackgroundId, ImageRef } from "./assets";
import type { ChatCue, Cue, StageCue, TextCue, VoiceChannel } from "./cues";
import { type Position, TINTS, toPoint } from "./presets";

/**
 * 場面を流すロジック（純関数）。画面の部品は components/common/story/stage にある。
 *
 * 舞台の状態（StageState）は「いま何が置いてあるか」だけを持つ。動き（アニメーション）は画面側で再生し、
 * スキップや途中からの再開では、ここで状態だけを先に進めて、最後の見た目を一度に出す。
 */
export type Sprite = {
  id: string;
  image: ImageRef;
  x: number;
  y: number;
  height: number;
  z: number;
  flip: boolean;
};

export type StageState = {
  background?: BackgroundId | { color: string };
  sprites: Sprite[];
  /** 重ねている色（なければ無し） */
  tint?: string;
  /** 暗転中か */
  blackout: boolean;
};

export const emptyStage: StageState = { sprites: [], blackout: false };

const DEFAULT_HEIGHT = { character: 80, prop: 30, src: 50 } as const;

function defaultHeight(image: ImageRef): number {
  if ("character" in image) return DEFAULT_HEIGHT.character;
  if ("prop" in image) return DEFAULT_HEIGHT.prop;
  return DEFAULT_HEIGHT.src;
}

function place(position: Position | undefined) {
  return toPoint(position);
}

/** 命令を1つ当てた後の舞台の状態（動きは含まない） */
export function applyCue(state: StageState, cue: StageCue | TextCue): StageState {
  switch (cue.type) {
    case "background":
      return { ...state, background: cue.image };
    case "show": {
      const point = place(cue.at);
      const sprite: Sprite = {
        id: cue.id,
        image: cue.image,
        x: point.x,
        y: point.y,
        height: cue.height ?? defaultHeight(cue.image),
        z: cue.z ?? 0,
        flip: cue.flip ?? false,
      };
      return { ...state, sprites: [...state.sprites.filter((s) => s.id !== cue.id), sprite] };
    }
    case "change":
      return {
        ...state,
        sprites: state.sprites.map((s) => (s.id === cue.id ? { ...s, image: cue.image } : s)),
      };
    case "move": {
      const point = place(cue.to);
      return {
        ...state,
        sprites: state.sprites.map((s) => (s.id === cue.id ? { ...s, x: point.x, y: point.y } : s)),
      };
    }
    case "hide":
      return { ...state, sprites: state.sprites.filter((s) => s.id !== cue.id) };
    case "clear":
      return { ...state, sprites: [] };
    case "effect":
      switch (cue.name) {
        case "tint":
          return {
            ...state,
            tint: cue.tint ? (TINTS[cue.tint as keyof typeof TINTS] ?? cue.tint) : TINTS.night,
          };
        case "clear-tint":
          return { ...state, tint: undefined };
        case "fade-to-black":
          return { ...state, blackout: true };
        case "fade-from-black":
          return { ...state, blackout: false };
        default:
          return state;
      }
    case "text":
      // 話している人の表情を変える
      if (cue.expression && cue.from) {
        return {
          ...state,
          sprites: state.sprites.map((s) =>
            "character" in s.image && s.image.character === cue.from
              ? { ...s, image: { character: cue.from, expression: cue.expression } }
              : s,
          ),
        };
      }
      return state;
    default:
      return state;
  }
}

/** index 番目の命令の手前までを当てた舞台の状態（途中から再開・スキップ用） */
export function stageAt(cues: Cue[], index: number, start: StageState = emptyStage): StageState {
  return cues.slice(0, index).reduce<StageState>((state, cue) => applyCue(state, cue), start);
}

/**
 * from から次の文章までに実行する命令と、止まる文章の位置。
 * 文章が無ければ textIndex は undefined（場面の最後まで命令を実行して終わり）。
 */
export function nextStop(cues: Cue[], from: number): { actions: StageCue[]; textIndex?: number } {
  const actions: StageCue[] = [];
  for (let index = from; index < cues.length; index += 1) {
    const cue = cues[index];
    if (cue.type === "text") {
      return { actions, textIndex: index };
    }
    actions.push(cue);
  }
  return { actions };
}

/** 文章だけを取り出す（ログ用） */
export function textsOf(cues: Cue[]): TextCue[] {
  return cues.filter((cue): cue is TextCue => cue.type === "text");
}

/**
 * 立っているフラグで出し分ける文章を除く（文章の when / unless）。
 * flags を渡さなければ全部返す（確認画面の単体再生など、状態を見せないとき）。
 */
export function visibleCues(cues: Cue[], flags?: readonly FlagId[]): Cue[] {
  if (!flags) return cues;
  return cues.filter(
    (cue) =>
      cue.type !== "text" ||
      ((cue.when ?? []).every((flag) => flags.includes(flag)) &&
        !(cue.unless ?? []).some((flag) => flags.includes(flag))),
  );
}

/** チャットに流すメッセージ（id は場面と命令の位置から作るので、何度組み立て直しても同じ） */
export type ChatMessage = Omit<ChatCue, "type" | "wait"> & { id: string };

/** 命令の並びの、index 番目の手前までに流したチャット */
export function chatsOf(beatId: string, cues: Cue[], index = cues.length): ChatMessage[] {
  return cues.slice(0, index).flatMap((cue, position) =>
    cue.type === "chat"
      ? [
          {
            id: `${beatId}:${position}`,
            channel: cue.channel,
            from: cue.from,
            text: cue.text,
            at: cue.at,
          },
        ]
      : [],
  );
}

/** 通話にいる人 */
export type VoiceMember = { who: CharacterId; muted: boolean };

/** 通話の様子（場面を流しているあいだだけ画面に出す） */
export type VoiceRoom = {
  channel: VoiceChannel;
  members: VoiceMember[];
  /** いま話している人（通話の枠の行を出している人。ミュート中なら無し） */
  speaking?: CharacterId;
};

/**
 * 命令の並びの、reached 番目の手前までを実行したときの通話の様子。
 * current は、いま出している行（通話の枠なら、その人を「話している」にする）。
 */
export function voiceAt(cues: Cue[], reached: number, current?: Cue): VoiceRoom[] {
  const rooms = new Map<VoiceChannel, VoiceMember[]>();
  for (const cue of cues.slice(0, reached)) {
    if (cue.type !== "voice") continue;
    const members = (rooms.get(cue.channel) ?? []).filter((member) => member.who !== cue.who);
    const before = rooms.get(cue.channel)?.find((member) => member.who === cue.who);
    if (cue.action === "join") members.push({ who: cue.who, muted: false });
    if (cue.action === "mute" || cue.action === "unmute") {
      if (before) members.push({ ...before, muted: cue.action === "mute" });
    }
    rooms.set(cue.channel, members);
  }
  const speaker = current?.type === "text" && current.frame === "call" ? current.from : undefined;
  return [...rooms].map(([channel, members]) => {
    const talking = members.find((member) => member.who === speaker && !member.muted);
    return { channel, members, ...(talking ? { speaking: talking.who } : {}) };
  });
}

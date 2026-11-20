import type { Beat } from "../types";
import { BACKGROUNDS, type ImageRef, PROPS, SPRITES } from "./assets";
import { CHAT_CHANNELS, type Cue, VOICE_CHANNELS } from "./cues";
import { CUSTOM_CUES } from "./custom";
import { MOTIONS, type MotionRef, TINTS, toMotion } from "./presets";

/**
 * 場面の書き間違いを見つける（テストと確認画面で使う）。型で防げないもの（出していない立ち絵を動かす、など）を見る。
 */
export type StageIssue = { beatId: string; index: number; message: string };

function checkImage(image: ImageRef): string | undefined {
  if ("character" in image && !(image.character in SPRITES)) {
    return `人物 ${image.character} の立ち絵がありません`;
  }
  if ("prop" in image && !(image.prop in PROPS)) {
    return `小物 ${image.prop} がありません`;
  }
  return undefined;
}

function checkMotion(motion: MotionRef | undefined): string | undefined {
  if (typeof motion === "string" && !(motion in MOTIONS)) {
    return `動きの型 ${motion} がありません`;
  }
  return undefined;
}

/** 命令の並びを1本ずつ検査する。shown はその時点で出ている立ち絵・小物の id */
function validateCues(
  beatId: string,
  cues: Cue[],
  start: Set<string>,
  offset: number,
): StageIssue[] {
  const issues: StageIssue[] = [];
  const shown = new Set(start);
  cues.forEach((cue, position) => {
    const index = offset + position;
    const add = (message: string | undefined) => {
      if (message) issues.push({ beatId, index, message });
    };
    switch (cue.type) {
      case "background":
        if (typeof cue.image === "string" && !(cue.image in BACKGROUNDS)) {
          add(`背景 ${cue.image} がありません`);
        }
        break;
      case "show":
        add(checkImage(cue.image));
        add(checkMotion(cue.enter));
        shown.add(cue.id);
        break;
      case "change":
        add(checkImage(cue.image));
        if (!shown.has(cue.id)) add(`出していない ${cue.id} を差し替えています`);
        break;
      case "move":
        if (!shown.has(cue.id)) add(`出していない ${cue.id} を動かしています`);
        break;
      case "animate": {
        add(checkMotion(cue.motion));
        if (cue.target !== "screen" && !shown.has(cue.target)) {
          add(`出していない ${cue.target} を動かしています`);
        }
        const motionExists = typeof cue.motion !== "string" || cue.motion in MOTIONS;
        if (cue.wait && motionExists && toMotion(cue.motion).repeat === Infinity) {
          add(`繰り返し続ける動きに wait を付けると、場面が止まります（${cue.target}）`);
        }
        break;
      }
      case "hide":
        add(checkMotion(cue.exit));
        if (!shown.has(cue.id)) add(`出していない ${cue.id} を消しています`);
        shown.delete(cue.id);
        break;
      case "clear":
        shown.clear();
        break;
      case "effect":
        if (
          cue.name === "tint" &&
          cue.tint &&
          !(cue.tint in TINTS) &&
          !/^(#|rgb|hsl)/.test(cue.tint)
        ) {
          add(`色 ${cue.tint} がわかりません（TINTS の名前か色の値）`);
        }
        break;
      case "custom":
        if (!(cue.name in CUSTOM_CUES)) add(`カスタム演出 ${cue.name} が登録されていません`);
        break;
      case "chat":
        if (!(cue.channel in CHAT_CHANNELS)) add(`チャットの場所 ${cue.channel} がありません`);
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?\+09:00$/.test(cue.at)) {
          add(`チャットの日時 ${cue.at} は日本時間の ISO 8601（+09:00）で書いてください`);
        }
        break;
      case "voice":
        if (!(cue.channel in VOICE_CHANNELS)) add(`通話の場所 ${cue.channel} がありません`);
        break;
      default:
        break;
    }
  });
  return issues;
}

/** 台本の後に、選択肢ごとの続きを1本ずつ検査する（選択肢どうしは混ぜない） */
export function validateBeat(beat: Beat): StageIssue[] {
  const main = validateCues(beat.id, beat.script, new Set(), 0);
  const shownAtEnd = new Set<string>();
  for (const cue of beat.script) {
    if (cue.type === "show") shownAtEnd.add(cue.id);
    if (cue.type === "hide") shownAtEnd.delete(cue.id);
    if (cue.type === "clear") shownAtEnd.clear();
  }
  const replies = (beat.choices ?? []).flatMap((choice) =>
    validateCues(beat.id, choice.reply ?? [], shownAtEnd, beat.script.length + 1),
  );
  return [...main, ...replies];
}

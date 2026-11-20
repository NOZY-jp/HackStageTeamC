import { scenes as defaultScenes } from "./script";
import type { Progress, Scene, TranscriptEntry, Trigger } from "./types";

/** 何も見つけていない初期状態。 */
export function emptyProgress(): Progress {
  return { flags: [], completedScenes: [], choices: {} };
}

/** 重複を除いてフラグを足す。 */
function withFlags(base: string[], added: string[]): string[] {
  return [...new Set([...base, ...added])];
}

/** 要求フラグがすべて立っているか。 */
export function hasAllFlags(progress: Progress, required: string[]): boolean {
  return required.every((flag) => progress.flags.includes(flag));
}

/** その場面をいま始められるか（未完了で、要求フラグがそろっている）。 */
export function isSceneAvailable(progress: Progress, scene: Scene): boolean {
  return !progress.completedScenes.includes(scene.id) && hasAllFlags(progress, scene.requires);
}

/** いま始められる場面（台本の順）。 */
export function availableScenes(progress: Progress, scenes: Scene[] = defaultScenes): Scene[] {
  return scenes.filter((scene) => isSceneAvailable(progress, scene));
}

/** 次に始まる場面（台本の順で最初のもの）。 */
export function nextScene(progress: Progress, scenes: Scene[] = defaultScenes): Scene | undefined {
  return availableScenes(progress, scenes)[0];
}

/** きっかけを起こしてフラグを立てる。 */
export function applyTrigger(progress: Progress, trigger: Trigger): Progress {
  return { ...progress, flags: withFlags(progress.flags, trigger.setsFlags) };
}

/**
 * 場面を終える。選択肢が必須の場面では choiceId を渡す。
 * 始められない場面・存在しない選択肢は例外にする（台本の誤りをテストで落とすため）。
 */
export function completeScene(progress: Progress, scene: Scene, choiceId?: string): Progress {
  if (!isSceneAvailable(progress, scene)) {
    throw new Error(`場面 ${scene.id} は今は始められません`);
  }
  const choice = choiceId
    ? scene.choices.find((candidate) => candidate.id === choiceId)
    : undefined;
  if (choiceId && !choice) {
    throw new Error(`場面 ${scene.id} に選択肢 ${choiceId} はありません`);
  }
  if (!choice && scene.choices.length > 0) {
    throw new Error(`場面 ${scene.id} は選択肢が必要です`);
  }

  return {
    flags: withFlags(progress.flags, [...scene.completesFlags, ...(choice?.setsFlags ?? [])]),
    completedScenes: [...progress.completedScenes, scene.id],
    choices: choice ? { ...progress.choices, [scene.id]: choice.id } : progress.choices,
  };
}

/**
 * 会話の履歴を、終わった場面と選んだ選択肢から組み立て直す。
 * メッセージ自体は保存しない（台本を差し替えれば履歴も変わる）。
 */
export function replayTranscript(
  progress: Progress,
  scenes: Scene[] = defaultScenes,
): TranscriptEntry[] {
  return scenes
    .filter((scene) => progress.completedScenes.includes(scene.id))
    .map((scene) => {
      const choiceId = progress.choices[scene.id];
      const choice = scene.choices.find((candidate) => candidate.id === choiceId);
      return {
        sceneId: scene.id,
        chapter: scene.chapter,
        title: scene.title,
        lines: scene.lines,
        ...(choice ? { choice: { id: choice.id, label: choice.label } } : {}),
      };
    });
}

/** 最初からやり直す。 */
export function resetProgress(): Progress {
  return emptyProgress();
}

/** 台本から場面IDで引く。 */
export function findScene(id: string, scenes: Scene[] = defaultScenes): Scene | undefined {
  return scenes.find((scene) => scene.id === id);
}

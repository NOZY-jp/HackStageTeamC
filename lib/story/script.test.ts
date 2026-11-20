import { describe, expect, it } from "vitest";
import { cast } from "./cast";
import { flags, triggers } from "./flags";
import { scenes } from "./script";
import type { Progress } from "./types";

const castIds = new Set(cast.map((member) => member.id));
const flagIds = new Set(flags.map((flag) => flag.id));

/** 台本を、きっかけ→選択肢（各場面は最初の選択肢）の順で最後まで進める。 */
function playThrough(): Progress {
  const progress: Progress = { flags: [], completedScenes: [], choices: {} };
  for (const trigger of triggers) {
    progress.flags = [...new Set([...progress.flags, ...trigger.setsFlags])];
  }
  for (let guard = 0; guard < scenes.length * 2; guard += 1) {
    const next = scenes.find(
      (scene) =>
        !progress.completedScenes.includes(scene.id) &&
        scene.requires.every((flag) => progress.flags.includes(flag)),
    );
    if (!next) {
      break;
    }
    const choice = next.choices[0];
    progress.flags = [
      ...new Set([...progress.flags, ...next.completesFlags, ...(choice?.setsFlags ?? [])]),
    ];
    progress.completedScenes.push(next.id);
    if (choice) {
      progress.choices[next.id] = choice.id;
    }
  }
  return progress;
}

describe("台本の整合性（#81）", () => {
  it("場面IDは重複しない", () => {
    const ids = scenes.map((scene) => scene.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("場面の選択肢IDは場面の中で重複しない", () => {
    for (const scene of scenes) {
      const ids = scene.choices.map((choice) => choice.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(scene.choices.length).toBeGreaterThan(0);
    }
  });

  it("出てくる人物は全員台帳にいる", () => {
    for (const scene of scenes) {
      expect(scene.lines.length).toBeGreaterThan(0);
      for (const line of scene.lines) {
        expect(castIds.has(line.speakerId), line.speakerId).toBe(true);
      }
    }
  });

  it("台本とフラグ定義のIDが一致する（未定義のフラグを使わない）", () => {
    const used = [
      ...scenes.flatMap((scene) => [
        ...scene.requires,
        ...scene.completesFlags,
        ...scene.choices.flatMap((choice) => choice.setsFlags),
      ]),
      ...triggers.flatMap((trigger) => trigger.setsFlags),
    ];
    for (const flag of used) {
      expect(flagIds.has(flag), flag).toBe(true);
    }
  });

  it("きっかけか台本のどこかで、すべてのフラグが立つ", () => {
    const raised = new Set([
      ...triggers.flatMap((trigger) => trigger.setsFlags),
      ...scenes.flatMap((scene) => [
        ...scene.completesFlags,
        ...scene.choices.flatMap((choice) => choice.setsFlags),
      ]),
    ]);
    for (const flag of flags) {
      expect(raised.has(flag.id), flag.id).toBe(true);
    }
  });

  it("必要なフラグは、その場面より前に立つ（最後まで進められる）", () => {
    const progress = playThrough();
    expect(progress.completedScenes).toHaveLength(scenes.length);
    expect(progress.completedScenes).toEqual(scenes.map((scene) => scene.id));
  });

  it("章は決められた4つだけ", () => {
    const chapters = new Set(scenes.map((scene) => scene.chapter));
    for (const chapter of chapters) {
      expect(["助言", "痕跡", "欠片", "現実"]).toContain(chapter);
    }
    expect(chapters.size).toBeGreaterThan(1);
  });
});

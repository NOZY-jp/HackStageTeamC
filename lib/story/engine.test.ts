import { describe, expect, it } from "vitest";
import {
  applyTrigger,
  availableScenes,
  completeScene,
  emptyProgress,
  nextScene,
  replayTranscript,
  resetProgress,
} from "./engine";
import { triggers } from "./flags";
import { scenes } from "./script";

const trigger = (id: string) => {
  const found = triggers.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`きっかけ ${id} がありません`);
  }
  return found;
};
const scene = (id: string) => {
  const found = scenes.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`場面 ${id} がありません`);
  }
  return found;
};

describe("進行ロジック（#81）", () => {
  it("最初は始められる場面が無い", () => {
    const progress = emptyProgress();
    expect(availableScenes(progress)).toEqual([]);
    expect(nextScene(progress)).toBeUndefined();
  });

  it("きっかけでフラグが立ち、場面が始められる（重複しない）", () => {
    let progress = emptyProgress();
    progress = applyTrigger(progress, trigger("open-mylist"));
    progress = applyTrigger(progress, trigger("open-mylist"));
    expect(progress.flags).toEqual(["mylist_opened"]);
    expect(nextScene(progress)?.id).toBe("ch1-mylist");
  });

  it("選択肢を選ぶと、選択とフラグが記録され、次の場面が始まる", () => {
    let progress = applyTrigger(emptyProgress(), trigger("open-mylist"));
    progress = completeScene(progress, scene("ch1-mylist"), "remember");

    expect(progress.completedScenes).toEqual(["ch1-mylist"]);
    expect(progress.choices["ch1-mylist"]).toBe("remember");
    expect(progress.flags).toContain("kai_contacted");
    expect(progress.flags).toContain("photo_hint");
    expect(nextScene(progress)?.id).toBe("ch1-photo");
  });

  it("始められない場面・無い選択肢・選択肢の未指定は例外", () => {
    const progress = emptyProgress();
    expect(() => completeScene(progress, scene("ch1-mylist"), "remember")).toThrow();

    let started = applyTrigger(progress, trigger("open-mylist"));
    expect(() => completeScene(started, scene("ch1-mylist"), "unknown")).toThrow();
    expect(() => completeScene(started, scene("ch1-mylist"))).toThrow();

    started = completeScene(started, scene("ch1-mylist"), "remember");
    expect(() => completeScene(started, scene("ch1-mylist"), "remember")).toThrow();
  });

  it("履歴は終わった場面だけを台本の順に、選んだ選択肢つきで組み立てる", () => {
    let progress = applyTrigger(emptyProgress(), trigger("open-mylist"));
    progress = completeScene(progress, scene("ch1-mylist"), "later");
    progress = completeScene(progress, scene("ch1-photo"), "go");

    const transcript = replayTranscript(progress);
    expect(transcript.map((entry) => entry.sceneId)).toEqual(["ch1-mylist", "ch1-photo"]);
    expect(transcript[0].choice).toEqual({ id: "later", label: "あとで見る" });
    expect(transcript[0].lines.length).toBeGreaterThan(0);
  });

  it("やり直すと初期状態に戻る", () => {
    let progress = applyTrigger(emptyProgress(), trigger("open-mylist"));
    progress = completeScene(progress, scene("ch1-mylist"), "remember");
    expect(resetProgress()).toEqual(emptyProgress());
  });
});

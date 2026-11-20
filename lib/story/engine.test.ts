import { describe, expect, it } from "vitest";
import {
  applyTrigger,
  availableScenes,
  completeScene,
  emptyProgress,
  isChoiceAvailable,
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
    expect(progress.choices["ch1-mylist"]).toEqual(["remember"]);
    expect(progress.flags).toEqual(["mylist_opened"]);
    // カイの連絡は本名が分かった後（コンテスト名で本名を知る前には始まらない）
    expect(nextScene(progress)).toBeUndefined();

    progress = applyTrigger(progress, trigger("read-contest-result"));
    expect(nextScene(progress)?.id).toBe("ch2-contest");
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

  it("かのんの写真を見ないと、カイの助言（ch3）は始まらない", () => {
    let progress = applyTrigger(emptyProgress(), trigger("read-contest-result"));
    expect(availableScenes(progress).map((s) => s.id)).not.toContain("ch3-kai");

    progress = completeScene(progress, scene("ch2-contest"), "see-photo");
    expect(progress.flags).toContain("bff_photos_seen");
    expect(availableScenes(progress).map((s) => s.id)).toContain("ch3-kai");
  });

  it("選択肢のゲート: 「でんちゃん」を見つけるまでカイに相談できない", () => {
    let progress = applyTrigger(emptyProgress(), trigger("read-contest-result"));
    progress = completeScene(progress, scene("ch2-contest"), "see-photo");
    const consult = scene("ch3-kai").choices[1];
    expect(consult.id).toBe("ask-kai");
    expect(isChoiceAvailable(progress, consult)).toBe(false);
    expect(() => completeScene(progress, scene("ch3-kai"), "ask-kai")).toThrow();

    // 旧ブログのコメント欄を読むと相談できるようになる
    progress = applyTrigger(progress, trigger("find-denchan"));
    expect(isChoiceAvailable(progress, consult)).toBe(true);
    const after = completeScene(progress, scene("ch3-kai"), "ask-kai");
    expect(after.flags).toContain("denchan_confirmed");
  });

  it("寄り道の選択肢（completesScene: false）は場面を終わらせず、ほかの選択肢を選び直せる", () => {
    let progress = applyTrigger(emptyProgress(), trigger("read-contest-result"));
    progress = applyTrigger(progress, trigger("find-denchan"));
    progress = completeScene(progress, scene("ch2-contest"), "see-photo");
    const before = progress.completedScenes.length;

    progress = completeScene(progress, scene("ch3-kai"), "ask-kai");
    expect(progress.flags).toContain("denchan_confirmed");
    expect(progress.completedScenes).toHaveLength(before);
    // 同じ場面がまだ始められる＝検索の選択肢を選べる
    expect(availableScenes(progress).map((s) => s.id)).toContain("ch3-kai");
    expect(progress.choices["ch3-kai"]).toEqual(["ask-kai"]);

    progress = completeScene(progress, scene("ch3-kai"), "search-name");
    expect(progress.completedScenes).toContain("ch3-kai");
    expect(progress.flags).toContain("facebook_search");
    expect(availableScenes(progress).map((s) => s.id)).toContain("ch4-matching");
  });

  it("「相談→検索」の順で選んでも、寄り道の選択とカイの助言が履歴に残る（#111）", () => {
    let progress = applyTrigger(emptyProgress(), trigger("read-contest-result"));
    progress = applyTrigger(progress, trigger("find-denchan"));
    progress = completeScene(progress, scene("ch2-contest"), "see-photo");

    progress = completeScene(progress, scene("ch3-kai"), "ask-kai");
    progress = completeScene(progress, scene("ch3-kai"), "search-name");

    // 寄り道の選択肢も選んだ順に残る（完了させた選択肢で上書きされない）
    expect(progress.choices["ch3-kai"]).toEqual(["ask-kai", "search-name"]);

    const entry = replayTranscript(progress).find((candidate) => candidate.sceneId === "ch3-kai");
    expect(entry?.choices.map((choice) => choice.id)).toEqual(["ask-kai", "search-name"]);
    // 結末の伏線になるカイの「でんちゃん」助言が履歴に残る
    expect(entry?.choices[0].label).toBe("カイに相談する");
    expect(entry?.choices[0].replyLines?.[0].speakerId).toBe("kai");
    expect(entry?.choices[0].replyLines?.[0].text).toContain("でんちゃん");
  });

  it("履歴は終わった場面だけを台本の順に、選んだ選択肢つきで組み立てる", () => {
    let progress = applyTrigger(emptyProgress(), trigger("open-mylist"));
    progress = completeScene(progress, scene("ch1-mylist"), "later");
    progress = applyTrigger(progress, trigger("read-contest-result"));
    progress = completeScene(progress, scene("ch2-contest"), "keep");

    const transcript = replayTranscript(progress);
    expect(transcript.map((entry) => entry.sceneId)).toEqual(["ch1-mylist", "ch2-contest"]);
    expect(transcript[0].choices).toEqual([{ id: "later", label: "あとで見る" }]);
    expect(transcript[0].lines.length).toBeGreaterThan(0);
  });

  it("やり直すと初期状態に戻る", () => {
    let progress = applyTrigger(emptyProgress(), trigger("open-mylist"));
    progress = completeScene(progress, scene("ch1-mylist"), "remember");
    expect(resetProgress()).toEqual(emptyProgress());
  });
});

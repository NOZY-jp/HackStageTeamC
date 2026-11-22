import { describe, expect, it } from "vitest";
import { choose, completedChats, transcript } from "./engine";
import { beats } from "./scenario";
import { loadState, saveState } from "./storage";
import type { Beat, StoryState } from "./types";

/**
 * #111: 寄り道（completes:false）の選択と台詞も履歴に残す。
 * 実シナリオの場面・選択肢・台詞をそのまま使い、fixture の自前文言では代替しない。
 * #182 の結末分岐は「カイの助言を聞いたか」を履歴から読み直すため、ここが欠けると伏線が消える。
 */

const state = (partial: Partial<StoryState> = {}): StoryState => ({
  flags: [],
  completed: [],
  choices: {},
  ...partial,
});

const findBeat = (id: string): Beat => {
  const beat = beats.find((candidate) => candidate.id === id);
  if (!beat) throw new Error(`${id} がありません`);
  return beat;
};

/** 実シナリオの場面を、保存 → 読み直し（リロードと同じ経路）に通す */
const reload = (value: StoryState): StoryState => {
  const store = new Map<string, string>();
  const memory = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
  saveState(memory, value);
  return loadState(memory);
};

const texts = (value: StoryState): string[] =>
  transcript(value, beats).flatMap(({ lines }) => lines.map((line) => line.text));

describe("寄り道の選択が履歴に残る（#111）", () => {
  const sample = findBeat("sample-all-cues");
  const detour = sample.choices?.find((choice) => choice.id === "detour");
  const detourReply = detour?.reply?.[0];
  const detourText = detourReply?.type === "text" ? detourReply.text : "";

  it("実サンプルの寄り道を選んでから別の選択肢で終えても、寄り道の台詞が履歴に残る", () => {
    expect(detour?.completes).toBe(false);
    expect(detourText).not.toBe("");
    let next = choose(state(), sample, "detour");
    next = choose(next, sample, "b");
    expect(next.completed).toContain(sample.id);
    expect(next.choices[sample.id]).toEqual(["detour", "b"]);
    expect(texts(next)).toContain(detourText);
  });

  it("保存して読み直しても、寄り道の選択は選んだ順の配列のまま残る", () => {
    let next = choose(state(), sample, "detour");
    next = choose(next, sample, "b");
    const loaded = reload(next);
    expect(loaded.choices[sample.id]).toEqual(["detour", "b"]);
    expect(texts(loaded)).toContain(detourText);
  });

  it("第五章の観察とカイの呼び名の助言は保存後も履歴に残る（#182 の伏線）", () => {
    const talkup = findBeat("ch5-talkup");
    const ready = state({
      flags: ["s08-real-name", "s09-kai-contact", "s10-talkup-match", "foundBff"],
      completed: ["ch5-kai-contact"],
    });
    const done = choose(ready, talkup, "visit-house");
    expect(done.flags).toContain("s11-address");
    const loaded = reload(done);
    expect(loaded.choices[talkup.id]).toEqual(["visit-house"]);
    expect(texts(loaded)).toContain("自己紹介の写真から、この人の日常がそのまま伝わってくる。");
    expect(texts(loaded).join("\n")).not.toMatch(/前に見た写真|同じ二人/);
    expect(completedChats(loaded)).toContainEqual(
      expect.objectContaining({ from: "kai", text: "そういえば、でんちゃんって呼ぶと喜ぶぞ" }),
    );
  });

  it("BFF の写真を見ていなくても、第五章は TalkUp の写真を指すだけで進む（#244）", () => {
    const talkup = findBeat("ch5-talkup");
    const ready = state({
      flags: ["s08-real-name", "s09-kai-contact", "s10-talkup-match"],
      completed: ["ch5-kai-contact"],
    });
    const done = choose(ready, talkup, "visit-house");
    const loaded = reload(done);
    const all = texts(loaded).join("\n");
    expect(all).not.toMatch(/前に見た写真|同じ二人/);
    expect(all).toContain("自己紹介の写真から、この人の日常がそのまま伝わってくる。");
    // 場面自体は BFF の写真を見ていなくても進む（foundBff は前提にしない）
    expect(done.flags).toContain("s11-address");
  });

  it("旧セーブ（場面ごとに1つの文字列）は、実 save の読込で1件の選択として読み替える", () => {
    const store = new Map<string, string>([
      [
        "hackstage:story:v1",
        JSON.stringify({
          flags: [],
          completed: [sample.id],
          choices: { [sample.id]: "detour" },
        }),
      ],
    ]);
    const loaded = loadState({ getItem: (key: string) => store.get(key) ?? null });
    expect(loaded.choices[sample.id]).toEqual(["detour"]);
    expect(texts(loaded)).toContain(detourText);
  });
});

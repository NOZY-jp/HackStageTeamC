import { describe, expect, it } from "vitest";
import {
  availableBeats,
  choose,
  completeBeat,
  currentChapter,
  initialState,
  linesOf,
  missingFor,
  nextBeat,
  remainingChoices,
  setFlag,
  transcript,
} from "./engine";
import type { Beat } from "./types";

const beats: Beat[] = [
  {
    id: "a",
    chapter: 2,
    channel: { kind: "monologue" },
    when: ["started"],
    lines: [{ from: "ryo", text: "A" }],
    sets: ["askedKai"],
  },
  {
    id: "b",
    chapter: 3,
    channel: { kind: "discord-dm", with: "kai" },
    when: ["askedKai"],
    lines: [{ from: "kai", text: "B" }],
    choices: [
      { id: "x", label: "X", sets: ["s03-blog-found"], reply: [{ from: "kai", text: "X!" }] },
      { id: "y", label: "Y" },
    ],
  },
];

describe("lib/story の進行", () => {
  it("条件のフラグがそろった場面だけ始まる", () => {
    expect(nextBeat(initialState, beats)).toBeUndefined();
    const started = setFlag(initialState, "started");
    expect(nextBeat(started, beats)?.id).toBe("a");
  });

  it("after の場面が終わるまでは始まらない", () => {
    const ordered: Beat[] = [
      { ...beats[0], id: "first", sets: [] },
      { ...beats[0], id: "second", after: ["first"], sets: [] },
    ];
    let state = setFlag(initialState, "started");
    expect(availableBeats(state, ordered).map((beat) => beat.id)).toEqual(["first"]);
    expect(missingFor(state, ordered[1])).toEqual({ flags: [], beats: ["first"] });
    state = completeBeat(state, ordered[0]);
    expect(availableBeats(state, ordered).map((beat) => beat.id)).toEqual(["second"]);
  });

  it("同じフラグを2回立てても1つ", () => {
    const state = setFlag(setFlag(initialState, "started"), "started");
    expect(state.flags).toEqual(["started"]);
  });

  it("場面を終えると sets のフラグが立ち、次の場面に進む", () => {
    let state = setFlag(initialState, "started");
    state = completeBeat(state, beats[0]);
    expect(state.flags).toContain("askedKai");
    expect(availableBeats(state, beats).map((beat) => beat.id)).toEqual(["b"]);
  });

  it("選択肢がある場面は、選ばないと終えられない", () => {
    expect(() => completeBeat(initialState, beats[1])).toThrow();
  });

  it("選んだ選択肢のフラグが立ち、会話にリョウの発言と返事が入る", () => {
    const state = completeBeat(initialState, beats[1], "x");
    expect(state.flags).toContain("s03-blog-found");
    expect(state.choices).toEqual({ b: ["x"] });
    expect(linesOf(beats[1], ["x"]).map((line) => line.text)).toEqual(["B", "X", "X!"]);
  });

  it("会話の履歴と章は、終わった場面から組み立て直せる", () => {
    let state = setFlag(initialState, "started");
    state = completeBeat(state, beats[0]);
    state = completeBeat(state, beats[1], "y");
    expect(transcript(state, beats).flatMap(({ lines }) => lines.map((line) => line.text))).toEqual(
      ["A", "B", "Y"],
    );
    expect(currentChapter(state, beats)).toBe(3);
    expect(currentChapter(initialState, beats)).toBe(1);
  });

  describe("寄り道（選んでも場面が終わらない選択肢）", () => {
    const talk: Beat = {
      id: "t",
      chapter: 5,
      channel: { kind: "discord-dm", with: "kai" },
      when: [],
      lines: [{ from: "kai", text: "どうする？" }],
      choices: [
        { id: "search", label: "検索する", sets: ["s10-talkup-match"] },
        {
          id: "ask",
          label: "相談する",
          requires: ["s03-blog-found"],
          completes: false,
          sets: ["askedKai"],
          reply: [{ from: "kai", text: "でんちゃんって呼ぶと喜ぶぞ" }],
        },
      ],
    };

    it("条件のフラグがそろうまで、その選択肢は出ない", () => {
      expect(remainingChoices(initialState, talk).map((choice) => choice.id)).toEqual(["search"]);
      const found = setFlag(initialState, "s03-blog-found");
      expect(remainingChoices(found, talk).map((choice) => choice.id)).toEqual(["search", "ask"]);
      expect(() => choose(initialState, talk, "ask")).toThrow();
    });

    it("寄り道を選んでも場面は続き、同じ寄り道は二度出ない", () => {
      const state = choose(setFlag(initialState, "s03-blog-found"), talk, "ask");
      expect(state.completed).toEqual([]);
      expect(state.flags).toContain("askedKai");
      expect(remainingChoices(state, talk).map((choice) => choice.id)).toEqual(["search"]);
    });

    it("相談→検索の順で選ぶと、履歴に寄り道の発言と返事も選んだ順に残る", () => {
      let state = setFlag(initialState, "s03-blog-found");
      state = choose(state, talk, "ask");
      state = choose(state, talk, "search");
      expect(state.completed).toEqual(["t"]);
      expect(state.choices).toEqual({ t: ["ask", "search"] });
      expect(
        transcript(state, [talk]).flatMap(({ lines }) => lines.map((line) => line.text)),
      ).toEqual(["どうする？", "相談する", "でんちゃんって呼ぶと喜ぶぞ", "検索する"]);
    });
  });
});

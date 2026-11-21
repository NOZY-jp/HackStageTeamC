import { describe, expect, it } from "vitest";
import { choose, completedChats, setFlag, transcript } from "./engine";
import { say } from "./stage";
import { loadState, parseState, saveState } from "./storage";
import type { Beat, StoryState } from "./types";

/**
 * #111: 寄り道（completes:false）の選択と台詞も履歴に残す。
 * #182 の結末分岐は「カイの助言を聞いたか」を履歴から読み直すため、ここが欠けると分岐の伏線が消える。
 */

const adviceBeat: Beat = {
  id: "t-advice",
  chapter: 3,
  layout: "overlay",
  when: [],
  script: [],
  choices: [
    { id: "search", label: "検索する", sets: ["s10-talkup-match"] },
    {
      id: "ask",
      label: "相談する",
      completes: false,
      sets: ["askedKai"],
      reply: [say("kai", "でんちゃんって呼ぶと喜ぶぞ")],
    },
  ],
};

const initial: StoryState = { flags: [], completed: [], choices: {} };

/** 保存 → 読み直し（リロードと同じ経路） */
const reload = (state: StoryState): StoryState => {
  const store = new Map<string, string>();
  const memory = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
  saveState(memory, state);
  return loadState(memory);
};

describe("寄り道の選択が履歴に残る（#111）", () => {
  it("相談してから検索で場面を終えても、助言の台詞が履歴に残る", () => {
    let state = choose(setFlag(initial, "s03-blog-found"), adviceBeat, "ask");
    state = choose(state, adviceBeat, "search");
    expect(state.choices["t-advice"]).toEqual(["ask", "search"]);
    const lines = transcript(state, [adviceBeat]).flatMap(({ lines }) =>
      lines.map((line) => line.text),
    );
    expect(lines).toContain("でんちゃんって呼ぶと喜ぶぞ");
  });

  it("保存して読み直しても、寄り道の選択は選んだ順の配列のまま残る", () => {
    let state = choose(setFlag(initial, "s03-blog-found"), adviceBeat, "ask");
    state = choose(state, adviceBeat, "search");
    const loaded = reload(state);
    expect(loaded.choices["t-advice"]).toEqual(["ask", "search"]);
    expect(
      transcript(loaded, [adviceBeat]).flatMap(({ lines }) => lines.map((line) => line.text)),
    ).toContain("でんちゃんって呼ぶと喜ぶぞ");
  });

  it("古いセーブ（場面ごとに1つの文字列）も、1件の選択として読み直す", () => {
    const legacy = parseState({
      flags: ["s03-blog-found"],
      completed: ["t-advice"],
      choices: { "t-advice": "ask" },
    });
    expect(legacy.choices["t-advice"]).toEqual(["ask"]);
    expect(
      transcript(legacy, [adviceBeat]).flatMap(({ lines }) => lines.map((line) => line.text)),
    ).toContain("でんちゃんって呼ぶと喜ぶぞ");
  });

  it("寄り道のあとに場面を終えても、助言を聞いた記録は消えない（#182 の伏線）", () => {
    let state = choose(setFlag(initial, "s03-blog-found"), adviceBeat, "ask");
    state = choose(state, adviceBeat, "search");
    const loaded = reload(state);
    expect(loaded.completed).toEqual(["t-advice"]);
    expect(loaded.choices["t-advice"]).toContain("ask");
    expect(
      transcript(loaded, [adviceBeat]).flatMap(({ lines }) => lines.map((line) => line.text)),
    ).toContain("でんちゃんって呼ぶと喜ぶぞ");
    expect(completedChats(loaded, [adviceBeat])).toBeDefined();
  });
});

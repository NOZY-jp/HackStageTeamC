import { describe, expect, it } from "vitest";
import {
  clearState,
  LEGACY_STORAGE_KEYS,
  loadState,
  readChoices,
  STORAGE_KEY,
  saveState,
} from "./storage";

/** localStorage の代わり */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

const [LEGACY_V2, LEGACY_V1] = LEGACY_STORAGE_KEYS;

describe("進行状態の保存", () => {
  it("いまの形を読み、知らないフラグや壊れた値は捨てる", () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({
        flags: ["started", "unknown_flag", 3],
        completed: ["a", 1],
        choices: { a: "x", b: ["y", 2] },
      }),
    });
    expect(loadState(storage)).toEqual({
      flags: ["started"],
      completed: ["a"],
      choices: { a: ["x"] },
    });
  });

  it("壊れた JSON や保存が無いときは初期状態", () => {
    expect(loadState(memoryStorage({ [STORAGE_KEY]: "{" }))).toEqual({
      flags: [],
      completed: [],
      choices: {},
    });
    expect(loadState(memoryStorage())).toEqual({ flags: [], completed: [], choices: {} });
  });

  it("試作版（v2）の保存しか無ければ、意味が同じフラグを段階のフラグに移す", () => {
    const storage = memoryStorage({
      [LEGACY_V2]: JSON.stringify({
        flags: ["mylist_opened", "real_name_known", "denchan_found"],
        completedScenes: ["ch1-mylist"],
        choices: { "ch1-mylist": ["remember"] },
      }),
    });
    expect(loadState(storage)).toEqual({
      flags: ["s06-old-profile-link", "s08-real-name"],
      completed: [],
      choices: {},
    });
  });

  it("試作版の v1（選択肢が場面ごとに1つ）も読んで移す", () => {
    const storage = memoryStorage({
      [LEGACY_V1]: JSON.stringify({
        flags: ["kai_contacted"],
        completedScenes: ["ch4-kanon"],
        choices: { "ch3-kai": "ask-kai" },
      }),
    });
    expect(loadState(storage).flags).toEqual(["s09-kai-contact"]);
  });

  it("いまの保存があれば、試作版の保存より優先する", () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({ flags: ["started"], completed: [], choices: {} }),
      [LEGACY_V2]: JSON.stringify({ flags: ["mylist_opened"], completedScenes: [], choices: {} }),
    });
    expect(loadState(storage).flags).toEqual(["started"]);
  });

  it("保存すると試作版の保存を消す（移したあとに古い値が残らない）", () => {
    const storage = memoryStorage({
      [LEGACY_V2]: JSON.stringify({ flags: ["mylist_opened"], completedScenes: [], choices: {} }),
      [LEGACY_V1]: JSON.stringify({ flags: [], completedScenes: [], choices: {} }),
    });
    saveState(storage, loadState(storage));
    expect([...storage.data.keys()]).toEqual([STORAGE_KEY]);
    expect(loadState(storage).flags).toEqual(["s06-old-profile-link"]);
  });

  it("やり直すと、いまの保存も試作版の保存も消える", () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: "{}",
      [LEGACY_V2]: "{}",
      [LEGACY_V1]: "{}",
    });
    clearState(storage);
    expect(storage.data.size).toBe(0);
  });

  it("選んだ選択肢: 前の形（場面ごとに1つ）は配列に直し、壊れた値は捨てる", () => {
    expect(readChoices({ a: "x", b: ["y", "z"] })).toEqual({ a: ["x"], b: ["y", "z"] });
    expect(readChoices({ a: 1, b: ["y", 2], c: "ok" })).toEqual({ c: ["ok"] });
    expect(readChoices(null)).toEqual({});
    expect(readChoices(["x"])).toEqual({});
  });
});

import { describe, expect, it } from "vitest";
import { applyTrigger, emptyProgress } from "./engine";
import { triggers } from "./flags";
import { clearProgress, isProgress, loadProgress, STORAGE_KEY, saveProgress } from "./storage";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}

describe("進行状態の保存（#81）", () => {
  it("保存して読み戻せる", () => {
    const storage = fakeStorage();
    const progress = applyTrigger(emptyProgress(), triggers[0]);
    saveProgress(progress, storage);
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
    expect(loadProgress(storage)).toEqual(progress);
  });

  it("保存が無い・壊れている場合は初期状態", () => {
    expect(loadProgress(fakeStorage())).toEqual(emptyProgress());
    expect(loadProgress(fakeStorage({ [STORAGE_KEY]: "{壊れた" }))).toEqual(emptyProgress());
    expect(loadProgress(fakeStorage({ [STORAGE_KEY]: '{"flags":"x"}' }))).toEqual(emptyProgress());
  });

  it("localStorage が無い環境（SSR）でも落ちない", () => {
    expect(loadProgress(undefined)).toEqual(emptyProgress());
    expect(() => saveProgress(emptyProgress(), undefined)).not.toThrow();
    expect(() => clearProgress(undefined)).not.toThrow();
  });

  it("消すと初期状態に戻る", () => {
    const storage = fakeStorage();
    saveProgress(applyTrigger(emptyProgress(), triggers[0]), storage);
    clearProgress(storage);
    expect(loadProgress(storage)).toEqual(emptyProgress());
  });

  it("localStorage が例外を投げても落ちない（SecurityError・容量不足）", () => {
    const throwing = {
      getItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
      removeItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    };
    expect(loadProgress(throwing)).toEqual(emptyProgress());
    expect(() => saveProgress(emptyProgress(), throwing)).not.toThrow();
    expect(() => clearProgress(throwing)).not.toThrow();
  });

  it("window.localStorage へのアクセス自体が拒否されても落ちない", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
    try {
      // 既定引数（browserStorage()）が例外を握りつぶし、保存できなくても初期状態で進む
      expect(() => loadProgress()).not.toThrow();
      expect(loadProgress()).toEqual(emptyProgress());
      expect(() => saveProgress(emptyProgress())).not.toThrow();
      expect(() => clearProgress()).not.toThrow();
    } finally {
      if (original) {
        Object.defineProperty(window, "localStorage", original);
      }
    }
  });

  it("形の検査", () => {
    expect(isProgress({ flags: [], completedScenes: [], choices: {} })).toBe(true);
    expect(isProgress({ flags: [], completedScenes: [], choices: { s: ["a"] } })).toBe(true);
    expect(isProgress(null)).toBe(false);
    expect(isProgress({ flags: [1], completedScenes: [], choices: {} })).toBe(false);
    expect(isProgress({ flags: [], completedScenes: [], choices: null })).toBe(false);
    expect(isProgress({ flags: [], completedScenes: [1], choices: {} })).toBe(false);
    // v1 の choices（場面あたり1値）はそのままでは今の形に合わない
    expect(isProgress({ flags: [], completedScenes: [], choices: { s: "a" } })).toBe(false);
  });

  it("v1 の保存を読んで今の形に移行する（choices の配列化・場面IDの付け替え）", () => {
    const storage = fakeStorage({
      "hackstage-story-progress-v1": JSON.stringify({
        flags: ["facebook_search"],
        completedScenes: ["ch3-kai", "ch4-kanon"],
        choices: { "ch3-kai": "search-name", "ch4-kanon": "x" },
      }),
    });

    expect(loadProgress(storage)).toEqual({
      flags: ["facebook_search"],
      completedScenes: ["ch3-kai", "ch4-matching"],
      choices: { "ch3-kai": ["search-name"], "ch4-matching": ["x"] },
    });
    // 次の保存は v2 キーに書く
    saveProgress(loadProgress(storage), storage);
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
  });
});

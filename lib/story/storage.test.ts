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

  it("形の検査", () => {
    expect(isProgress({ flags: [], completedScenes: [], choices: {} })).toBe(true);
    expect(isProgress(null)).toBe(false);
    expect(isProgress({ flags: [1], completedScenes: [], choices: {} })).toBe(false);
    expect(isProgress({ flags: [], completedScenes: [], choices: null })).toBe(false);
    expect(isProgress({ flags: [], completedScenes: [1], choices: {} })).toBe(false);
  });
});

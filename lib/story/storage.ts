import { emptyProgress } from "./engine";
import type { Progress } from "./types";

/** 保存キー。形式を変えたら上げる。 */
export const STORAGE_KEY = "hackstage-story-progress-v1";

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem" | "removeItem">;

const browserStorage = (): Storage | undefined =>
  typeof window === "undefined" ? undefined : window.localStorage;

/** 保存値が進行状態の形をしているか（壊れた値は捨てる）。 */
export function isProgress(value: unknown): value is Progress {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<Progress>;
  return (
    Array.isArray(candidate.flags) &&
    candidate.flags.every((flag) => typeof flag === "string") &&
    Array.isArray(candidate.completedScenes) &&
    candidate.completedScenes.every((id) => typeof id === "string") &&
    typeof candidate.choices === "object" &&
    candidate.choices !== null &&
    Object.values(candidate.choices).every((choice) => typeof choice === "string")
  );
}

/** 保存された進行状態を読む。無い・壊れている場合は初期状態。 */
export function loadProgress(storage: ReadableStorage | undefined = browserStorage()): Progress {
  if (!storage) {
    return emptyProgress();
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyProgress();
    }
    const parsed: unknown = JSON.parse(raw);
    return isProgress(parsed) ? parsed : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

/** 進行状態を保存する（localStorage が無い環境では何もしない）。 */
export function saveProgress(
  progress: Progress,
  storage: WritableStorage | undefined = browserStorage(),
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // 容量不足などで保存できないときは、その回のセッションだけ進める
  }
}

/** 保存を消して最初からやり直す。 */
export function clearProgress(storage: WritableStorage | undefined = browserStorage()): void {
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // 消せないときは何もしない
  }
}

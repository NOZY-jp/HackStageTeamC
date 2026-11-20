import { emptyProgress } from "./engine";
import type { Progress } from "./types";

/** 保存キー。形式を変えたら上げる。 */
export const STORAGE_KEY = "hackstage-story-progress-v2";

/** 寄り道の選択肢が履歴に残る前の保存キー（choices が場面あたり1値だった v1）。 */
const LEGACY_STORAGE_KEY = "hackstage-story-progress-v1";

/** あとから付け替えた場面ID（旧ID → 新ID）。履歴を失わないため保存値も直す。 */
const RENAMED_SCENES: Record<string, string> = {
  "ch4-kanon": "ch4-matching",
};

/**
 * 旧形式の保存を今の形にそろえる（v1 → v2）。
 * - choices が場面あたり1値（文字列）だったので配列にする
 * - 場面IDの付け替えを completedScenes / choices のキーに反映する
 * v2 の形の値を渡しても変わらない（べき等）。
 */
function migrateProgress(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }
  const candidate = value as { choices?: unknown; completedScenes?: unknown };
  const choices =
    candidate.choices && typeof candidate.choices === "object" && !Array.isArray(candidate.choices)
      ? Object.fromEntries(
          Object.entries(candidate.choices).map(([sceneId, picked]) => [
            RENAMED_SCENES[sceneId] ?? sceneId,
            typeof picked === "string" ? [picked] : picked,
          ]),
        )
      : candidate.choices;
  const completedScenes = Array.isArray(candidate.completedScenes)
    ? candidate.completedScenes.map((id) =>
        typeof id === "string" ? (RENAMED_SCENES[id] ?? id) : id,
      )
    : candidate.completedScenes;
  return { ...candidate, choices, completedScenes };
}

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem" | "removeItem">;

/** 進行状態が変わったことを確認画面へ知らせるイベント名。 */
export const PROGRESS_EVENT = "hackstage-story-progress";

/** localStorage はプライバシー設定などで触れないことがある（SecurityError）。 */
const browserStorage = (): Storage | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

/** 保存できたときだけ、同じタブの画面へ知らせる。 */
function notifyProgress(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // イベントが使えない環境では何もしない
  }
}

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
    Object.values(candidate.choices).every(
      (picked) => Array.isArray(picked) && picked.every((id) => typeof id === "string"),
    )
  );
}

/** 保存された進行状態を読む。無い・壊れている場合は初期状態。 */
export function loadProgress(storage: ReadableStorage | undefined = browserStorage()): Progress {
  if (!storage) {
    return emptyProgress();
  }
  try {
    // v2 が無ければ v1 を読んで移行する（次回の保存から v2 に書く）
    const raw = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return emptyProgress();
    }
    const parsed: unknown = migrateProgress(JSON.parse(raw));
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
    notifyProgress();
  } catch {
    // 容量不足などで保存できないときは、その回のセッションだけ進める
  }
}

/**
 * 保存を消して最初からやり直す。
 * v1 を消し忘れると、直後の loadProgress が v1 から復元してしまうので両方消す。
 */
export function clearProgress(storage: WritableStorage | undefined = browserStorage()): void {
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // 消せないときは何もしない
  }
  try {
    storage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // v1 が無い・消せない環境でも、v2 の削除は済んでいる
  }
}

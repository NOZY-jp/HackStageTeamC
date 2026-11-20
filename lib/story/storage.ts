import { FLAG_IDS, type FlagId } from "./flags";
import type { StoryState } from "./types";

/**
 * 進行状態の保存（localStorage）。読み書きは Storage を受け取る純粋な関数にして、テストできるようにする。
 * 画面からは components/common/story/story-provider.tsx が使う。
 */
export const STORAGE_KEY = "hackstage:story:v1";

/** 試作版（#96・#114）の保存キー。新しい形に移したら消す */
export const LEGACY_STORAGE_KEYS = ["hackstage-story-progress-v2", "hackstage-story-progress-v1"];

/**
 * 試作版のフラグ → いまのフラグ（謎解きの段階）。意味が同じものだけ移す。
 * 試作版の場面（ch1-mylist など）と、段階に当たらないフラグ（でんちゃん関係・かのんの写真）は、
 * いまの台本に同じものが無いので移さない
 */
const LEGACY_FLAGS: Record<string, FlagId> = {
  mylist_opened: "s06-old-profile-link",
  real_name_known: "s08-real-name",
  kai_contacted: "s09-kai-contact",
  facebook_search: "s10-talkup-match",
};

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const initial = (): StoryState => ({ flags: [], completed: [], choices: {} });

const isFlag = (value: unknown): value is FlagId =>
  typeof value === "string" && (FLAG_IDS as string[]).includes(value);

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/**
 * 選んだ選択肢を読む。前の形（場面ごとに1つの文字列）も、選んだ順の配列として読み直す。
 * 壊れた値は捨てる。
 */
export function readChoices(value: unknown): StoryState["choices"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const choices: StoryState["choices"] = {};
  for (const [beatId, chosen] of Object.entries(value)) {
    if (typeof chosen === "string") {
      choices[beatId] = [chosen];
    } else if (Array.isArray(chosen) && chosen.every((id) => typeof id === "string")) {
      choices[beatId] = chosen;
    }
  }
  return choices;
}

/** いまの形の保存値を読む。知らないフラグや壊れた値は捨てる */
export function parseState(value: unknown): StoryState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return initial();
  }
  const candidate = value as Record<string, unknown>;
  return {
    flags: strings(candidate.flags).filter(isFlag),
    completed: strings(candidate.completed),
    choices: readChoices(candidate.choices),
  };
}

/** 試作版の保存値（flags / completedScenes / choices）を、いまの形に移す。移せるのはフラグだけ */
export function fromLegacy(value: unknown): StoryState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return initial();
  }
  const flags = strings((value as Record<string, unknown>).flags).flatMap((flag) => {
    const mapped = LEGACY_FLAGS[flag];
    return mapped ? [mapped] : [];
  });
  return { ...initial(), flags: [...new Set(flags)] };
}

/** 保存された進行状態を読む（無い・壊れていれば初期状態）。試作版の保存しか無ければ、それを移す */
export function loadState(storage: ReadableStorage): StoryState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      return parseState(JSON.parse(raw));
    }
    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = storage.getItem(key);
      if (legacy) {
        return fromLegacy(JSON.parse(legacy));
      }
    }
  } catch {
    // 壊れていれば初期状態から
  }
  return initial();
}

/** 進行状態を保存し、試作版の保存を消す（移したあとに古い値が残らないように） */
export function saveState(storage: WritableStorage, state: StoryState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
  for (const key of LEGACY_STORAGE_KEYS) {
    storage.removeItem(key);
  }
}

/** やり直す（いまの保存も試作版の保存も消す） */
export function clearState(storage: WritableStorage): void {
  storage.removeItem(STORAGE_KEY);
  for (const key of LEGACY_STORAGE_KEYS) {
    storage.removeItem(key);
  }
}

"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type Beat,
  completeBeat,
  type FlagId,
  initialState,
  nextBeat,
  type StoryState,
  setFlag,
} from "@/lib/story";

/**
 * シナリオの進行状態を、全プラットフォームで共有する。
 * 保存先が無いので localStorage に持つ（このブラウザでだけ続きから遊べる）。
 */
const STORAGE_KEY = "hackstage:story:v1";

type StoryContextValue = {
  state: StoryState;
  /** 次に始まる場面 */
  upcoming?: Beat;
  setFlag: (flag: FlagId) => void;
  completeBeat: (beat: Beat, choiceId?: string) => void;
  reset: () => void;
  /** 保存された状態を読み終えたか（読む前に画面がフラグを立てて上書きしないように） */
  ready: boolean;
};

const StoryContext = createContext<StoryContextValue | null>(null);

function load(): StoryState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState;
    }
    const parsed = JSON.parse(raw) as Partial<StoryState>;
    return {
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      choices: readChoices(parsed.choices),
    };
  } catch {
    return initialState;
  }
}

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

function save(state: StoryState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 保存できなくても、開いているあいだは遊べる
  }
}

export function StoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoryState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      save(state);
    }
  }, [state, ready]);

  const onSetFlag = useCallback(
    (flag: FlagId) => setState((current) => setFlag(current, flag)),
    [],
  );
  const onComplete = useCallback(
    (beat: Beat, choiceId?: string) => setState((current) => completeBeat(current, beat, choiceId)),
    [],
  );
  const reset = useCallback(() => setState(initialState), []);

  const value = useMemo<StoryContextValue>(
    () => ({
      state,
      upcoming: nextBeat(state),
      setFlag: onSetFlag,
      completeBeat: onComplete,
      reset,
      ready,
    }),
    [state, onSetFlag, onComplete, reset, ready],
  );

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStory(): StoryContextValue {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error("useStory は StoryProvider の中で使ってください");
  }
  return context;
}

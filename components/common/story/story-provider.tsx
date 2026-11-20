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
  loadState,
  nextBeat,
  type StoryState,
  saveState,
  setFlag,
} from "@/lib/story";

/**
 * シナリオの進行状態を、全プラットフォームで共有する。
 * 保存先が無いので localStorage に持つ（このブラウザでだけ続きから遊べる。読み書きは lib/story/storage.ts）。
 */

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

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function load(): StoryState {
  const storage = browserStorage();
  return storage ? loadState(storage) : initialState;
}

function save(state: StoryState) {
  const storage = browserStorage();
  try {
    if (storage) saveState(storage, state);
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

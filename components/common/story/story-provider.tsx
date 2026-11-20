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
  type ChatChannel,
  type ChatMessage,
  completeBeat,
  completedChats,
  type FlagId,
  initialState,
  nextBeat,
  type StoryState,
  setFlag,
  type VoiceChannel,
  type VoiceRoom,
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
  /** 場面を終える。chosen はこの場面で選んだ選択肢（寄り道も、選んだ順） */
  completeBeat: (beat: Beat, chosen?: readonly string[]) => void;
  reset: () => void;
  /** 保存された状態を読み終えたか（読む前に画面がフラグを立てて上書きしないように） */
  ready: boolean;
  /** 物語の中で流したチャット（終わった場面の分と、いま流している場面の分） */
  chats: ChatMessage[];
  /** いま流している場面のチャット（ScenePlayer が知らせる） */
  setLiveChats: (chats: ChatMessage[]) => void;
  /** 場面を流している（後ろの画面を操作させない）。StoryStage が知らせ、StoryPage が後ろを inert にする */
  covering: boolean;
  setCovering: (covering: boolean) => void;
  /** いま流している場面の通話の様子（場面が終わったら空） */
  voice: VoiceRoom[];
  setVoice: (rooms: VoiceRoom[]) => void;
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
  const [liveChats, setLiveChats] = useState<ChatMessage[]>([]);
  const [voice, setVoice] = useState<VoiceRoom[]>([]);
  const [covering, setCovering] = useState(false);

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
    (beat: Beat, chosen: readonly string[] = []) =>
      setState((current) => {
        // 選んだ順に選び直す（寄り道は場面を続け、最後の選択肢で場面が終わる）
        const next = chosen.reduce((state, id) => completeBeat(state, beat, id), current);
        return next.completed.includes(beat.id) ? next : completeBeat(next, beat);
      }),
    [],
  );
  const reset = useCallback(() => {
    setState(initialState);
    setLiveChats([]);
    setVoice([]);
  }, []);

  const chats = useMemo(() => {
    const done = completedChats(state);
    const doneIds = new Set(done.map((chat) => chat.id));
    // 場面が終わると、いま流している分は終わった分に入るので、重ねて出さない
    return [...done, ...liveChats.filter((chat) => !doneIds.has(chat.id))];
  }, [state, liveChats]);

  const value = useMemo<StoryContextValue>(
    () => ({
      state,
      upcoming: nextBeat(state),
      setFlag: onSetFlag,
      completeBeat: onComplete,
      reset,
      ready,
      chats,
      setLiveChats,
      voice,
      setVoice,
      covering,
      setCovering,
    }),
    [state, onSetFlag, onComplete, reset, ready, chats, voice, covering],
  );

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

/**
 * 物語の中でそのチャットに流したメッセージ。各プラットフォームの画面は、これを過去のデータの後ろに足して出す。
 * StoryProvider の外（単体のテストなど）では空。
 */
export function useStoryChats(channel: ChatChannel): ChatMessage[] {
  const context = useContext(StoryContext);
  return useMemo(
    () => (context ? context.chats.filter((chat) => chat.channel === channel) : []),
    [context, channel],
  );
}

/**
 * 各プラットフォームの画面の入れ物。場面を流しているあいだは inert にして、
 * マウスだけでなく Tab・キー入力でも後ろの画面を操作できないようにする（ルートレイアウトで children を包む）。
 * 箱は作らない（display: contents）ので、各画面のレイアウトは変わらない。
 */
export function StoryPage({ children }: { children: ReactNode }) {
  const context = useContext(StoryContext);
  return (
    <div className="contents" inert={context?.covering ?? false}>
      {children}
    </div>
  );
}

/** 物語の中のその通話の様子。場面を流していないときは undefined（StoryProvider の外でも undefined） */
export function useStoryVoice(channel: VoiceChannel | undefined): VoiceRoom | undefined {
  const context = useContext(StoryContext);
  return channel ? context?.voice.find((room) => room.channel === channel) : undefined;
}

export function useStory(): StoryContextValue {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error("useStory は StoryProvider の中で使ってください");
  }
  return context;
}

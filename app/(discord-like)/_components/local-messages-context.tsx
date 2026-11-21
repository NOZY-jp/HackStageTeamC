"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useStoryChats } from "@/components/common/story/story-provider";
import type { Message } from "@/lib/discord-like/types";
import type { ChatMessage } from "@/lib/story";
import { SELF_USER_ID } from "./self-user";
import { STORY_USERS } from "./story-users";

/** 物語の中で流したメッセージを、Discord のメッセージの形にする */
function toMessage(channelKey: string, chat: ChatMessage): Message {
  return {
    id: `story-${chat.id}`,
    channelId: channelKey,
    authorId: STORY_USERS[chat.from],
    sentAt: chat.at,
    body: chat.text,
  };
}

type LocalMessages = {
  messagesFor: (channelKey: string) => Message[];
  /** 送信（表示のみ）。`system` はデータを変えずにシステム行として描くための印。 */
  addMessage: (channelKey: string, body: string, options?: { system?: boolean }) => void;
  /** いま通話中のスレッド（null なら通話していない）。ルートの再マウントに依存しない（#140）。 */
  activeCallThreadId: string | null;
  /** 通話を開始する（同じスレッドで二重に開始しない）。 */
  startCall: (threadId: string) => void;
  /** 通話を終了する（開始していなければ何もしない）。 */
  endCall: (threadId: string) => void;
};

const LocalMessagesContext = createContext<LocalMessages | null>(null);

export function useLocalMessages(): LocalMessages {
  const controls = useContext(LocalMessagesContext);
  if (!controls) {
    throw new Error("useLocalMessages は LocalMessagesProvider の内側でだけ使えます");
  }
  return controls;
}

/** Provider の外でも安全に呼べる版（表示だけの画面・テスト用）。 */
export function useOptionalLocalMessages(): LocalMessages | null {
  return useContext(LocalMessagesContext);
}

/**
 * 送信したメッセージをチャンネル／DMスレッド単位で保持する（クライアントのみ）。
 * 物語の中で流したメッセージ（lib/story のチャットの命令）も、ここで過去のデータの後ろに足す。
 * lib/discord-like の配列は書き換えない。リロードで消える。
 */
export function LocalMessagesProvider({ children }: { children: ReactNode }) {
  const [byKey, setByKey] = useState<Record<string, Message[]>>({});
  // 通話状態は Provider（レイアウト）に置く。ページは Next のルートキャッシュで
  // 再マウントされないことがあり、ページ内 state では再入場を拾えないため。
  const [activeCallThreadId, setActiveCallThreadId] = useState<string | null>(null);
  // 場面の進行に合わせて、その相手とのDMにメッセージを出す。
  const storyDm = useStoryChats("discord:dm-maimai");
  const storyKai = useStoryChats("discord:dm-kai");
  const sequence = useRef(0);

  const addMessage = useCallback(
    (channelKey: string, body: string, options?: { system?: boolean }) => {
      sequence.current += 1;
      const message: Message = {
        id: `local-${channelKey}-${sequence.current}`,
        channelId: channelKey,
        authorId: SELF_USER_ID,
        sentAt: new Date().toISOString(),
        body,
        ...(options?.system ? { system: true } : {}),
      };
      setByKey((previous) => ({
        ...previous,
        [channelKey]: [...(previous[channelKey] ?? []), message],
      }));
    },
    [],
  );

  const activeCallRef = useRef<string | null>(null);
  const startCall = useCallback(
    (threadId: string) => {
      if (activeCallRef.current === threadId) return;
      activeCallRef.current = threadId;
      setActiveCallThreadId(threadId);
      addMessage(threadId, "通話を開始しました", { system: true });
    },
    [addMessage],
  );

  const endCall = useCallback(
    (threadId: string) => {
      if (activeCallRef.current !== threadId) return;
      activeCallRef.current = null;
      setActiveCallThreadId(null);
      addMessage(threadId, "通話を終了しました", { system: true });
    },
    [addMessage],
  );

  const controls = useMemo<LocalMessages>(
    () => ({
      messagesFor: (channelKey) => [
        ...(channelKey === "dm-maimai" ? storyDm.map((chat) => toMessage(channelKey, chat)) : []),
        ...(channelKey === "dm-kai" ? storyKai.map((chat) => toMessage(channelKey, chat)) : []),
        ...(byKey[channelKey] ?? []),
      ],
      addMessage,
      activeCallThreadId,
      startCall,
      endCall,
    }),
    [activeCallThreadId, addMessage, byKey, endCall, startCall, storyDm, storyKai],
  );

  return <LocalMessagesContext.Provider value={controls}>{children}</LocalMessagesContext.Provider>;
}

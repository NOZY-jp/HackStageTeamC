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
import type { Message } from "@/lib/discord-like/types";
import { SELF_USER_ID } from "./self-user";

type LocalMessages = {
  messagesFor: (channelKey: string) => Message[];
  addMessage: (channelKey: string, body: string) => void;
};

const LocalMessagesContext = createContext<LocalMessages | null>(null);

export function useLocalMessages(): LocalMessages {
  const controls = useContext(LocalMessagesContext);
  if (!controls) {
    throw new Error("useLocalMessages は LocalMessagesProvider の内側でだけ使えます");
  }
  return controls;
}

/**
 * 送信したメッセージをチャンネル／DMスレッド単位で保持する（クライアントのみ）。
 * lib/discord-like の配列は書き換えない。リロードで消える。
 */
export function LocalMessagesProvider({ children }: { children: ReactNode }) {
  const [byKey, setByKey] = useState<Record<string, Message[]>>({});
  const sequence = useRef(0);

  const addMessage = useCallback((channelKey: string, body: string) => {
    sequence.current += 1;
    const message: Message = {
      id: `local-${channelKey}-${sequence.current}`,
      channelId: channelKey,
      authorId: SELF_USER_ID,
      sentAt: new Date().toISOString(),
      body,
    };
    setByKey((previous) => ({
      ...previous,
      [channelKey]: [...(previous[channelKey] ?? []), message],
    }));
  }, []);

  const controls = useMemo<LocalMessages>(
    () => ({
      messagesFor: (channelKey) => byKey[channelKey] ?? [],
      addMessage,
    }),
    [byKey, addMessage],
  );

  return <LocalMessagesContext.Provider value={controls}>{children}</LocalMessagesContext.Provider>;
}

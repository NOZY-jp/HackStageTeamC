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
 * 物語の中で流したメッセージ（lib/story のチャットの命令）も、ここで過去のデータの後ろに足す。
 * lib/discord-like の配列は書き換えない。リロードで消える。
 */
export function LocalMessagesProvider({ children }: { children: ReactNode }) {
  const [byKey, setByKey] = useState<Record<string, Message[]>>({});
  // 物語の中で流したメッセージ（場面の進み具合で増える）。いまは MaiMai との DM だけ
  const storyDm = useStoryChats("discord:dm-maimai");
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

  const controls = useMemo<LocalMessages>(
    () => ({
      messagesFor: (channelKey) => [
        ...(channelKey === "dm-maimai" ? storyDm.map((chat) => toMessage(channelKey, chat)) : []),
        ...(byKey[channelKey] ?? []),
      ],
      addMessage,
    }),
    [byKey, addMessage, storyDm],
  );

  return <LocalMessagesContext.Provider value={controls}>{children}</LocalMessagesContext.Provider>;
}

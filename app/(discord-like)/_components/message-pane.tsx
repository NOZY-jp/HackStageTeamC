"use client";

import { useMemo } from "react";
import type { Message } from "@/lib/discord-like/types";
import { useLocalMessages } from "./local-messages-context";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";

/**
 * メッセージログ＋入力欄。送信分はクライアント状態（Context）で持ち、
 * 初期データ（lib/discord-like）には書き戻さない。キーはチャンネルID／DMスレッドID。
 */
export function MessagePane({
  channelKey,
  initialMessages,
  title,
  topic,
  showHash,
  headerAvatar,
}: {
  channelKey: string;
  initialMessages: Message[];
  title: string;
  topic?: string;
  showHash?: boolean;
  headerAvatar?: { displayName: string; avatarColor: string };
}) {
  const { messagesFor, addMessage } = useLocalMessages();
  const localMessages = messagesFor(channelKey);

  const messages = useMemo(
    () => [...initialMessages, ...localMessages].sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    [initialMessages, localMessages],
  );

  return (
    <MessageList
      messages={messages}
      title={title}
      topic={topic}
      showHash={showHash}
      headerAvatar={headerAvatar}
      composer={<MessageComposer onSend={(body) => addMessage(channelKey, body)} />}
    />
  );
}

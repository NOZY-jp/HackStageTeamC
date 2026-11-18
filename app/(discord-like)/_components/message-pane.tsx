"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { listDMMessages, listMessages, type MessagePage } from "@/lib/discord-like";
import type { Message } from "@/lib/discord-like/types";
import { useLocalMessages } from "./local-messages-context";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";

/** 同梱データなので実時間はほぼ0。スケルトンの状態遷移を見せるためだけの待ち。 */
const PAGING_DELAY_MS = 120;

type Mode = "channel" | "dm";

const fetchPage = (mode: Mode, channelKey: string, before: string): MessagePage =>
  mode === "dm"
    ? listDMMessages({ threadId: channelKey, before })
    : listMessages({ channelId: channelKey, before });

/**
 * メッセージログ＋入力欄。送信分はクライアント状態（Context）で持ち、
 * 初期データ（lib/discord-like）には書き戻さない。キーはチャンネルID／DMスレッドID。
 *
 * 古いメッセージは最初のページ（最新50件）だけをサーバーから渡し、
 * 上スクロールで `before` カーソルを使って50件ずつ先頭に足していく。
 */
export function MessagePane({
  channelKey,
  mode,
  initialPage,
  title,
  topic,
  showHash,
  headerAvatar,
}: {
  channelKey: string;
  mode: Mode;
  initialPage: MessagePage;
  title: string;
  topic?: string;
  showHash?: boolean;
  headerAvatar?: { displayName: string; avatarColor: string };
}) {
  const { messagesFor, addMessage } = useLocalMessages();
  const localMessages = messagesFor(channelKey);

  const scrollRef = useRef<HTMLDivElement>(null);
  const compensationRef = useRef<{ node: HTMLElement; top: number } | null>(null);

  const [older, setOlder] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialPage.nextCursor);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loading, setLoading] = useState(false);

  // 古いメッセージを先頭に足した直後、基準にしたメッセージが動いた分だけ scrollTop を戻す。
  // 高さではなく実際の要素位置で測るので、スケルトンの出入りがあってもずれない。
  // biome-ignore lint/correctness/useExhaustiveDependencies: older の変化（追加読み込み完了）で1回だけ補正する
  useLayoutEffect(() => {
    const anchor = compensationRef.current;
    const element = scrollRef.current;
    if (!anchor || !element) {
      return;
    }
    compensationRef.current = null;
    if (!anchor.node.isConnected) {
      return;
    }
    const delta = Math.round(anchor.node.getBoundingClientRect().top) - anchor.top;
    if (delta !== 0) {
      element.scrollTop += delta;
    }
  }, [older]);

  // チャンネル／DM を切り替えたらページング状態を捨てる（別チャンネルの続きを混ぜない）
  const pageRef = useRef(initialPage);
  pageRef.current = initialPage;
  const keyRef = useRef(channelKey);
  useEffect(() => {
    if (keyRef.current === channelKey) {
      return;
    }
    keyRef.current = channelKey;
    setOlder([]);
    setCursor(pageRef.current.nextCursor);
    setHasMore(pageRef.current.hasMore);
    setLoading(false);
  }, [channelKey]);

  const loadOlder = useCallback(async () => {
    if (loading || !hasMore || cursor === null) {
      return;
    }
    const element = scrollRef.current;
    // 先頭に足す前の「見えている先頭メッセージ」を基準にする
    if (element) {
      const box = element.getBoundingClientRect();
      for (const row of element.querySelectorAll<HTMLElement>(".message")) {
        const rect = row.getBoundingClientRect();
        if (rect.bottom > box.top) {
          compensationRef.current = { node: row, top: Math.round(rect.top) };
          break;
        }
      }
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, PAGING_DELAY_MS));
      const page = fetchPage(mode, channelKey, cursor);
      setOlder((previous) => [...page.messages, ...previous]);
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } finally {
      setLoading(false);
    }
  }, [channelKey, cursor, hasMore, loading, mode]);

  const messages = useMemo(
    () =>
      [...older, ...initialPage.messages, ...localMessages].sort((a, b) =>
        a.sentAt.localeCompare(b.sentAt),
      ),
    [older, initialPage.messages, localMessages],
  );

  return (
    <MessageList
      messages={messages}
      title={title}
      topic={topic}
      showHash={showHash}
      headerAvatar={headerAvatar}
      onLoadOlder={loadOlder}
      loadingOlder={loading}
      hasMore={hasMore}
      resetKey={channelKey}
      scrollRef={scrollRef}
      composer={<MessageComposer onSend={(body) => addMessage(channelKey, body)} />}
    />
  );
}

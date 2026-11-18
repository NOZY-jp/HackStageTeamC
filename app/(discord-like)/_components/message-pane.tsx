"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { listDMMessages, listMessages, type MessagePage } from "@/lib/discord-like";
import type { Message } from "@/lib/discord-like/types";
import { useLocalMessages } from "./local-messages-context";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";
import { isAtBottom } from "./paging-scroll";

/** 同梱データなので実時間はほぼ0。スケルトンの状態遷移を見せるためだけの待ち。 */
const PAGING_DELAY_MS = 120;

type Mode = "channel" | "dm";

const fetchPage = (mode: Mode, channelKey: string, before: string): MessagePage =>
  mode === "dm"
    ? listDMMessages({ threadId: channelKey, before })
    : listMessages({ channelId: channelKey, before });

/**
 * ページング状態は「どのチャンネルのものか」を必ず持ち、キーが変わったら作り直す。
 * 別キーの結果を混ぜないための世代（requestId）も一緒に持つ。
 */
type Paging = {
  key: string;
  requestId: number;
  older: Message[];
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
};

const initialPaging = (key: string, page: MessagePage, requestId = 0): Paging => ({
  key,
  requestId,
  older: [],
  cursor: page.nextCursor,
  hasMore: page.hasMore,
  loading: false,
});

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
  const contentRef = useRef<HTMLDivElement>(null);
  /**
   * 追加読み込み中だけ有効な補正の基準。
   * 画像などで高さが後から伸びても基準メッセージの位置が動かないよう、
   * ResizeObserver で高さ変化のたびに「基準メッセージのずれ」を打ち消す。
   */
  const loadAnchorRef = useRef<{ key: string; node: HTMLElement; top: number } | null>(null);
  const wasAtBottomRef = useRef(true);

  const [paging, setPaging] = useState<Paging>(() => initialPaging(channelKey, initialPage));
  const [detached, setDetached] = useState(false);
  const wasVisibleRef = useRef(false);

  /**
   * App Router は切替後も前の画面を display:none で残すことがある。
   * その残骸がメッセージを抱えたままだと DOM 上で件数が混ざって見えるため、
   * 描画されていない（= clientRect が無い）ことを検知したら中身を捨てる。
   */
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const check = () => {
      if (element.getClientRects().length > 0) {
        wasVisibleRef.current = true;
        return;
      }
      // 一度も描画されていない（テスト環境など）場合は消えたとみなさない
      if (wasVisibleRef.current) {
        setDetached(true);
      }
    };
    // ルーターが前の画面を display:none に切り替えるのを属性変更で拾う
    const paneElement = element.closest(".app-main") ?? element;
    const mutations =
      typeof MutationObserver === "undefined" ? null : new MutationObserver(() => check());
    mutations?.observe(paneElement, { attributes: true, attributeFilter: ["style", "class"] });

    // ルーターのキャッシュで display:none に変わるのは非同期なので、しばらく見張る
    const interval = setInterval(check, 200);
    const stopWatching = setTimeout(() => clearInterval(interval), 5000);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(check, { threshold: 0 });
    observer?.observe(element);
    check();
    return () => {
      clearInterval(interval);
      clearTimeout(stopWatching);
      observer?.disconnect();
      mutations?.disconnect();
    };
  }, []);

  // 表示に使う状態。キーが変わっていたらその場で作り直す（前のチャンネルの配列を持ち越さない）
  const current: Paging =
    paging.key === channelKey
      ? paging
      : initialPaging(channelKey, initialPage, paging.requestId + 1);

  // キーが変わったら state 側も作り直す（レンダー中に setState しないための後追い）
  useEffect(() => {
    if (paging.key !== channelKey) {
      setPaging((previous) => initialPaging(channelKey, initialPage, previous.requestId + 1));
    }
  }, [channelKey, initialPage, paging.key]);

  // 読み込み開始時に決めた基準メッセージが動かないように、高さが変わるたび補正する。
  // スケルトンは絶対配置（高さ0）なので、画像の読み込みなどで後から伸びる分にも追随できる。
  useEffect(() => {
    const content = contentRef.current;
    const element = scrollRef.current;
    if (!content || !element || typeof ResizeObserver === "undefined") {
      return;
    }
    const compensate = () => {
      const anchor = loadAnchorRef.current;
      if (!anchor || anchor.key !== channelKey || !anchor.node.isConnected) {
        return;
      }
      const delta = Math.round(anchor.node.getBoundingClientRect().top) - anchor.top;
      if (delta !== 0) {
        element.scrollTop += delta;
        anchor.top = Math.round(anchor.node.getBoundingClientRect().top);
      }
    };
    const observer = new ResizeObserver(compensate);
    observer.observe(content);
    return () => observer.disconnect();
  }, [channelKey]);

  // 追加分の描画が落ち着いたら基準を捨てる（後から届く画像の伸びまでは追う）
  // biome-ignore lint/correctness/useExhaustiveDependencies: older が増えた時だけタイマーを張り直す
  useEffect(() => {
    if (!loadAnchorRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      loadAnchorRef.current = null;
    }, 2500);
    return () => clearTimeout(timer);
  }, [current.older.length]);

  const loadOlder = useCallback(async () => {
    if (current.loading || !current.hasMore || current.cursor === null) {
      return;
    }
    const key = current.key;
    const requestId = current.requestId;
    const cursor = current.cursor;
    const element = scrollRef.current;
    if (element) {
      // いま見えている先頭のメッセージを基準にする
      const box = element.getBoundingClientRect();
      for (const row of element.querySelectorAll<HTMLElement>(".message")) {
        const rect = row.getBoundingClientRect();
        if (rect.bottom > box.top) {
          loadAnchorRef.current = { key, node: row, top: Math.round(rect.top) };
          break;
        }
      }
    }

    setPaging((previous) =>
      previous.key === key && previous.requestId === requestId
        ? { ...previous, loading: true }
        : previous,
    );

    await new Promise((resolve) => setTimeout(resolve, PAGING_DELAY_MS));
    const page = fetchPage(mode, key, cursor);

    // await のあいだにチャンネルが変わっていたら、その結果は捨てる
    const elementAfter = scrollRef.current;
    if (elementAfter && elementAfter.getClientRects().length === 0 && wasVisibleRef.current) {
      return;
    }

    setPaging((previous) => {
      if (previous.key !== key || previous.requestId !== requestId) {
        return previous;
      }
      // 二重発火などで同じページが来ても重複させない
      const known = new Set(previous.older.map((message) => message.id));
      const incoming = page.messages.filter((message) => !known.has(message.id));
      return {
        ...previous,
        older: [...incoming, ...previous.older],
        cursor: page.nextCursor,
        hasMore: page.hasMore,
        loading: false,
      };
    });
  }, [current, mode]);

  const handleSend = useCallback(
    (body: string) => {
      const element = scrollRef.current;
      wasAtBottomRef.current = element
        ? isAtBottom({
            scrollTop: element.scrollTop,
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight,
          })
        : true;
      addMessage(channelKey, body);
    },
    [addMessage, channelKey],
  );

  // 送信で末尾に増えたとき、送信前に最下部にいたなら最下部へ追従する
  // biome-ignore lint/correctness/useExhaustiveDependencies: 送信（末尾追加）のタイミングでだけ判定する
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || !wasAtBottomRef.current) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, [localMessages.length]);

  const messages = useMemo(
    () =>
      [...current.older, ...initialPage.messages, ...localMessages].sort((a, b) =>
        a.sentAt.localeCompare(b.sentAt),
      ),
    [current.older, initialPage.messages, localMessages],
  );

  // ルーターに残った前の画面（display:none）は描画しない
  if (detached) {
    return null;
  }

  return (
    <MessageList
      messages={messages}
      title={title}
      topic={topic}
      showHash={showHash}
      headerAvatar={headerAvatar}
      onLoadOlder={loadOlder}
      loadingOlder={current.loading}
      hasMore={current.hasMore}
      resetKey={channelKey}
      scrollRef={scrollRef}
      contentRef={contentRef}
      composer={<MessageComposer onSend={handleSend} />}
    />
  );
}

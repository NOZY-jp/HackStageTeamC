"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchMessagePage } from "@/app/(discord-like)/_actions/message-page";
import { useStoryOptional } from "@/components/common/story/story-provider";
import type {
  MemberView,
  Message,
  MessageAuthor,
  MessageView,
  VoiceSession,
} from "@/lib/discord-like/types";
import type { FlagId } from "@/lib/story";
import { useLocalMessages } from "./local-messages-context";
import { MessageComposer } from "./message-composer";
import { MessageList, type StoryMemberEntry } from "./message-list";
import { isAtBottom } from "./paging-scroll";

/** 同梱データなので実時間はほぼ0。スケルトンの状態遷移を見せるためだけの待ち。 */
const PAGING_DELAY_MS = 120;
/** 追加読み込み後、画像などの遅い伸びに追随する最大時間（無操作が続く場合の上限） */
const COMPENSATE_MS = 1200;

type Mode = "channel" | "dm";

/**
 * ページング状態は「どのチャンネルのものか」を必ず持ち、キーが変わったら作り直す。
 * 戻ってきたときのために、キーごとに直近の状態を覚えておく（再読込しない）。
 */
type Paging = {
  key: string;
  requestId: number;
  older: Message[];
  authors: Record<string, MessageAuthor>;
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
};

const initialPaging = (key: string, view: MessageView, requestId = 0): Paging => ({
  key,
  requestId,
  older: [],
  authors: {},
  cursor: view.nextCursor,
  hasMore: view.hasMore,
  loading: false,
});

/**
 * メッセージログ＋入力欄。送信分はクライアント状態（Context）で持ち、
 * 初期データ（lib/discord-like）には書き戻さない。キーはチャンネルID／DMスレッドID。
 *
 * 古いメッセージは Server Action 経由で 50 件ずつ取得する（クライアントに本文データは置かない）。
 */
export function MessagePane({
  channelKey,
  mode,
  initialView,
  title,
  topic,
  showHash,
  headerAvatar,
  headerAction,
  voiceSessions = [],
  members = [],
  storyMember,
  focusMessageId,
  seen,
}: {
  channelKey: string;
  mode: Mode;
  initialView: MessageView;
  title: string;
  topic?: string;
  showHash?: boolean;
  headerAvatar?: { displayName: string; avatarColor: string };
  /** ヘッダ右端の導線（DM の通話ボタンなど）。 */
  headerAction?: ReactNode;
  /** 通話履歴の算出に使う VoiceSession（#149） */
  voiceSessions?: VoiceSession[];
  /** メンバー一覧（サーバー側で作って渡す）。 */
  members?: MemberView[];
  /** 物語の進行で後から名簿に加わるメンバー。 */
  storyMember?: StoryMemberEntry;
  /** 検索結果からジャンプしてきたメッセージ（強調して表示する）。 */
  focusMessageId?: string;
  /**
   * このメッセージが画面に見えたら立てる物語のフラグ（手がかりを見つけた合図）。
   * StoryProvider の外（部品テストなど）では何も起きない。
   */
  seen?: { messageId: string; flag: FlagId };
}) {
  const { messagesFor, addMessage } = useLocalMessages();
  const story = useStoryOptional();
  const localMessages = messagesFor(channelKey);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  /**
   * 追加読み込み中だけ有効な補正の基準。
   * 画像などで高さが後から伸びても基準メッセージの位置が動かないよう、
   * ResizeObserver で高さ変化のたびに「基準メッセージのずれ」を打ち消す。
   */
  const loadAnchorRef = useRef<{ key: string; node: HTMLElement; top: number } | null>(null);
  // 検索からジャンプしてきたときは最下部にいないので、初回の「送信で下端へ」は働かせない
  const wasAtBottomRef = useRef(!focusMessageId);

  /** 位置補正の基準を捨てる（送信・「最新へ」・ユーザー操作で呼ぶ）。 */
  const releaseAnchor = useCallback(() => {
    loadAnchorRef.current = null;
  }, []);

  const [paging, setPaging] = useState<Paging>(() => initialPaging(channelKey, initialView));
  const pagingRef = useRef(paging);
  pagingRef.current = paging;
  // チャンネルごとの読み込み済み状態（戻ったときに続きから表示する）
  const cacheRef = useRef<Map<string, Paging>>(new Map());

  // 表示に使う状態。キーが変わっていたら、そのキーのキャッシュ（無ければ初期状態）を使う
  const current: Paging =
    paging.key === channelKey
      ? paging
      : (cacheRef.current.get(channelKey) ??
        initialPaging(channelKey, initialView, paging.requestId + 1));

  // キーが変わったら今の状態を退避し、切り替え先の状態へ移る
  useEffect(() => {
    if (paging.key === channelKey) {
      return;
    }
    // 読み込み中に切り替わっても、戻ったときにスケルトンが固着しないようにする
    cacheRef.current.set(paging.key, { ...paging, loading: false });
    const cached = cacheRef.current.get(channelKey);
    setPaging(
      cached
        ? { ...cached, loading: false }
        : initialPaging(channelKey, initialView, paging.requestId + 1),
    );
  }, [channelKey, initialView, paging]);

  // 読み込み開始時に決めた基準メッセージが動かないように、高さが変わるたび補正する。
  // 利用者が自分でスクロールし始めたら補正はやめる（操作を打ち消さない）。
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

    const release = () => {
      loadAnchorRef.current = null;
    };
    element.addEventListener("wheel", release, { passive: true });
    element.addEventListener("touchstart", release, { passive: true });
    element.addEventListener("keydown", release);
    return () => {
      observer.disconnect();
      element.removeEventListener("wheel", release);
      element.removeEventListener("touchstart", release);
      element.removeEventListener("keydown", release);
    };
  }, [channelKey]);

  // 読み込みが終わった時点から上限つきで補正を続ける（画像の遅い伸びに備える）。
  // ユーザー操作（スクロール・送信・最新へ）が入ったら即解除する。
  // biome-ignore lint/correctness/useExhaustiveDependencies: older が増えた時だけタイマーを張り直す
  useEffect(() => {
    if (current.loading || !loadAnchorRef.current) {
      return;
    }
    const timer = setTimeout(releaseAnchor, COMPENSATE_MS);
    return () => clearTimeout(timer);
  }, [current.loading, current.older.length, releaseAnchor]);

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

    try {
      await new Promise((resolve) => setTimeout(resolve, PAGING_DELAY_MS));
      const page = await fetchMessagePage({ mode, key, before: cursor });

      // 取得中にチャンネルが変わっていたら、その結果は捨てる（loading は必ず戻す）
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
          authors: { ...previous.authors, ...page.authors },
          cursor: page.nextCursor,
          hasMore: page.hasMore,
          loading: false,
        };
      });
    } finally {
      // 結果を捨てた／例外でもスケルトンを固着させない
      setPaging((previous) =>
        previous.key === key && previous.requestId === requestId && previous.loading
          ? { ...previous, loading: false }
          : previous,
      );
    }
  }, [current, mode]);

  const handleSend = useCallback(
    (body: string) => {
      // 送信はユーザー操作。追加読み込みの補正基準は捨てて、最下部追従の判定に任せる
      releaseAnchor();
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
    [addMessage, channelKey, releaseAnchor],
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

  // 本文はサーバーから渡されたものだけを使い、書き手はその付属情報から引く
  const authors = useMemo(
    () => ({ ...initialView.authors, ...current.authors }),
    [initialView.authors, current.authors],
  );

  const messages = useMemo(
    () =>
      [...current.older, ...initialView.messages, ...localMessages].sort((a, b) =>
        a.sentAt.localeCompare(b.sentAt),
      ),
    [current.older, initialView.messages, localMessages],
  );

  const handleMessageSeen = useCallback(() => {
    if (seen) story?.setFlag(seen.flag);
  }, [seen, story]);

  return (
    <MessageList
      messages={messages}
      authors={authors}
      title={title}
      topic={topic}
      showHash={showHash}
      headerAvatar={headerAvatar}
      headerAction={headerAction}
      voiceSessions={voiceSessions}
      members={members}
      storyMember={storyMember}
      focusMessageId={focusMessageId}
      seenMessageId={seen?.messageId}
      onMessageSeen={seen ? handleMessageSeen : undefined}
      onLoadOlder={loadOlder}
      loadingOlder={current.loading}
      hasMore={current.hasMore}
      resetKey={channelKey}
      scrollRef={scrollRef}
      contentRef={contentRef}
      onJumpToLatest={releaseAnchor}
      composer={<MessageComposer onSend={handleSend} />}
    />
  );
}

"use client";

import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PaneToggles } from "@/components/discord-like/pane-toggles";
import type { MemberView, Message, MessageAuthor } from "@/lib/discord-like/types";
import { EmptyState } from "./empty-state";
import { MessageRow } from "./message-row";

const FIVE_MINUTES = 5 * 60 * 1000;
/** 一番下からこれ以上離れたら「最新へ」を出す */
const AWAY_FROM_BOTTOM = 320;
/** 追加読み込みを始める余白（この距離まで上端が近づいたら次を取る） */
const LOAD_MARGIN = "200px";
const SKELETON_ROWS = ["a", "b", "c"] as const;

/** 表示は固定データの UTC 表記をそのまま使う（相対表記にしない）。 */
const dateOf = (sentAt: string) => sentAt.slice(0, 10);
const formatDate = (sentAt: string) => {
  const [year, month, day] = dateOf(sentAt).split("-");
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
};
const formatTime = (sentAt: string) => sentAt.slice(11, 16);

type Row =
  | { type: "date"; key: string; label: string }
  | {
      type: "message";
      key: string;
      message: Message;
      grouped: boolean;
      replyTarget: Message | undefined;
    };

/**
 * テキストチャンネル／DM 共通のメッセージログ。
 * URL や params に依存せず、見た目の切り替えは props（showHash など）だけで行う。
 *
 * 古いメッセージの追加読み込みは `onLoadOlder` を呼ぶだけにして、
 * スクロール位置の補正（先頭に足しても画面を飛ばさない）はここで行う。
 */
export function MessageList({
  messages,
  authors,
  title,
  topic,
  showHash = true,
  emptyText = "まだメッセージがありません",
  headerAvatar,
  composer,
  onLoadOlder,
  loadingOlder = false,
  hasMore = true,
  resetKey,
  scrollRef,
  contentRef,
  onJumpToLatest,
  members = [],
}: {
  messages: Message[];
  /** 書き手情報（サーバーから渡される）。 */
  authors: Record<string, MessageAuthor>;
  title: string;
  topic?: string;
  showHash?: boolean;
  emptyText?: string;
  /** DM などでヘッダに出す相手のアバター（省略時は出さない）。 */
  headerAvatar?: { displayName: string; avatarColor: string };
  /** ログの下に差し込む入力欄（省略時は出さない）。 */
  composer?: ReactNode;
  /** 上端に近づいたとき、古いメッセージを追加で読み込む。 */
  onLoadOlder?: () => void;
  /** 追加読み込み中（先頭にスケルトンを出す）。 */
  loadingOlder?: boolean;
  /** さらに古いメッセージが残っているか。false なら終端表示。 */
  hasMore?: boolean;
  /** チャンネル／DM が変わったらスクロール位置を初期化するためのキー。 */
  resetKey?: string;
  /** スクロール要素の ref（親が位置補正に使う）。 */
  scrollRef?: RefObject<HTMLDivElement | null>;
  /** 中身のラッパーの ref（高さ変化の監視に使う）。 */
  contentRef?: RefObject<HTMLDivElement | null>;
  /** 「最新へ」を押したとき（位置補正の基準を捨てるために親へ知らせる）。 */
  onJumpToLatest?: () => void;
  /** 右パネルに出すメンバー一覧。 */
  members?: MemberView[];
}) {
  const fallbackScrollRef = useRef<HTMLDivElement>(null);
  const scrollElement = scrollRef ?? fallbackScrollRef;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [awayFromBottom, setAwayFromBottom] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [openProfileId, setOpenProfileId] = useState<string | null>(null);

  const onlineMembers = members.filter((member) => member.status !== "offline");
  const offlineMembers = members.filter((member) => member.status === "offline");

  // 初回表示・チャンネル切替時は最下部（最新）へ
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetKey はチャンネル切替の合図。ref は依存にしない
  useLayoutEffect(() => {
    const element = scrollElement.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
      setAwayFromBottom(false);
    }
  }, [resetKey]);

  // 上端の sentinel を監視して、古いメッセージを追加で読み込む
  // biome-ignore lint/correctness/useExhaustiveDependencies: スクロール要素の ref はマウント後も同一
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollElement.current;
    if (!sentinel || !root || !onLoadOlder || !hasMore) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadOlder();
        }
      },
      { root, rootMargin: LOAD_MARGIN, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadOlder]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: スクロール要素の ref はマウント後も同一
  const handleScroll = useCallback(() => {
    const element = scrollElement.current;
    if (!element) {
      return;
    }
    const gap = element.scrollHeight - element.scrollTop - element.clientHeight;
    setAwayFromBottom(gap > AWAY_FROM_BOTTOM);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: スクロール要素の ref はマウント後も同一
  const scrollToLatest = useCallback(() => {
    const element = scrollElement.current;
    if (!element) {
      return;
    }
    // 利用者の操作なので、追加読み込みの位置補正はここで打ち切る
    onJumpToLatest?.();
    element.scrollTop = element.scrollHeight;
    setAwayFromBottom(false);
  }, [onJumpToLatest]);

  const byId = new Map(messages.map((message) => [message.id, message]));
  const rows: Row[] = [];
  let currentDate = "";
  let previous: Message | undefined;

  for (const message of messages) {
    const date = dateOf(message.sentAt);
    if (date !== currentDate) {
      currentDate = date;
      rows.push({ type: "date", key: `date-${date}`, label: formatDate(message.sentAt) });
      previous = undefined;
    }

    const grouped =
      previous !== undefined &&
      previous.authorId === message.authorId &&
      Date.parse(message.sentAt) - Date.parse(previous.sentAt) <= FIVE_MINUTES;

    rows.push({
      type: "message",
      key: message.id,
      message,
      grouped,
      replyTarget: message.replyToId ? byId.get(message.replyToId) : undefined,
    });
    previous = message;
  }

  return (
    <main
      id="app-main"
      className={members.length > 0 ? "app-main app-main--channel" : "app-main"}
      aria-label={title}
    >
      <div className="app-main-body">
        <header className="pane-header message-header">
          <PaneToggles />
          {headerAvatar ? (
            <span
              aria-hidden="true"
              className="message-header-avatar"
              style={{ backgroundColor: headerAvatar.avatarColor }}
            >
              {headerAvatar.displayName.slice(0, 1)}
            </span>
          ) : null}
          <div className="message-header-text">
            <h1 className="message-header-title">
              {showHash ? (
                <span aria-hidden="true" className="message-header-hash">
                  #
                </span>
              ) : null}
              <span className="truncate">{title}</span>
            </h1>
            {topic ? <p className="message-header-topic">{topic}</p> : null}
          </div>
          {/* 検索・メンバーは見た目のみ（操作は #8 の非対象） */}
          <div className="message-header-actions">
            <span role="img" aria-label="検索" className="message-header-icon">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <button
              type="button"
              aria-label="メンバー"
              aria-expanded={showMembers}
              aria-controls="members-panel"
              className="message-header-icon message-header-button"
              onClick={() => setShowMembers((previous) => !previous)}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="8" r="3.2" />
                <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
                <path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 20a5 5 0 0 0-2-4" />
              </svg>
            </button>
          </div>
        </header>

        <div ref={scrollElement} className="pane-scroll message-scroll" onScroll={handleScroll}>
          {messages.length === 0 ? (
            <EmptyState
              kind="message"
              title={emptyText}
              description="下の入力欄から送信できます。"
            />
          ) : (
            <div className="message-scroll-content" ref={contentRef}>
              <div
                className="message-history-top"
                ref={sentinelRef}
                data-testid="history-sentinel"
              />
              {loadingOlder ? (
                <div className="message-skeleton" aria-hidden="true">
                  {SKELETON_ROWS.map((row) => (
                    <div className="message-skeleton-row" key={`skeleton-${row}`}>
                      <span className="skeleton-block message-skeleton-avatar" />
                      <span className="message-skeleton-lines">
                        <span
                          className="skeleton-block message-skeleton-line"
                          style={{ width: "96px" }}
                        />
                        <span
                          className="skeleton-block message-skeleton-line"
                          style={{ width: "320px" }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {!hasMore ? <p className="message-history-end">ここが最初のメッセージです</p> : null}
              {loadingOlder ? (
                <p className="visually-hidden" role="status">
                  古いメッセージを読み込み中
                </p>
              ) : null}

              <div className="message-list-inner">
                {rows.map((row) =>
                  row.type === "date" ? (
                    <div key={row.key} className="message-date">
                      {row.label}
                    </div>
                  ) : (
                    <MessageRow
                      key={row.key}
                      message={row.message}
                      authors={authors}
                      grouped={row.grouped}
                      replyTarget={row.replyTarget}
                      time={formatTime(row.message.sentAt)}
                    />
                  ),
                )}
              </div>
            </div>
          )}
        </div>
        {awayFromBottom ? (
          <button type="button" className="message-jump-latest" onClick={scrollToLatest}>
            最新へ
          </button>
        ) : null}
        {composer ? <div className="message-composer-area">{composer}</div> : null}
      </div>
      {showMembers ? (
        <aside id="members-panel" className="members-panel" aria-label="メンバー一覧">
          <div className="members-panel-head">
            <h2 className="members-panel-title">メンバー</h2>
            <button
              type="button"
              className="members-panel-close"
              aria-label="メンバー一覧を閉じる"
              onClick={() => setShowMembers(false)}
            >
              ×
            </button>
          </div>
          <div className="members-panel-scroll">
            {[
              { label: `オンライン — ${onlineMembers.length}`, list: onlineMembers },
              { label: `オフライン — ${offlineMembers.length}`, list: offlineMembers },
            ].map((group) => (
              <section key={group.label} className="members-group" aria-label={group.label}>
                <h3 className="members-group-title">{group.label}</h3>
                <ul className="members-list">
                  {group.list.map((member) => (
                    <li key={member.id} className="members-item">
                      <button
                        type="button"
                        className="members-row"
                        aria-expanded={openProfileId === member.id}
                        onClick={() =>
                          setOpenProfileId((previous) =>
                            previous === member.id ? null : member.id,
                          )
                        }
                      >
                        <span
                          aria-hidden="true"
                          className="members-avatar"
                          style={{ backgroundColor: member.avatarColor }}
                        >
                          {member.displayName.slice(0, 1)}
                        </span>
                        <span className="members-names">
                          <span className="members-name">{member.displayName}</span>
                          <span className="members-handle">{member.handle}</span>
                        </span>
                        <span className="members-status" data-status={member.status ?? "offline"} />
                      </button>
                      {openProfileId === member.id ? (
                        <div className="members-profile">
                          <p className="members-profile-handle">{member.handle}</p>
                          {member.profileUrl ? (
                            <a
                              className="members-profile-link"
                              href={member.profileUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              プロフィールのリンク
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </aside>
      ) : null}
    </main>
  );
}

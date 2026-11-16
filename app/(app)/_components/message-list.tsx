"use client";

import { useEffect, useRef } from "react";
import { PaneToggles } from "@/components/pane-toggles";
import type { Message } from "@/lib/mock/types";
import { MessageRow } from "./message-row";

const FIVE_MINUTES = 5 * 60 * 1000;

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
 */
export function MessageList({
  messages,
  title,
  topic,
  showHash = true,
  emptyText = "まだメッセージがありません",
  headerAvatar,
}: {
  messages: Message[];
  title: string;
  topic?: string;
  showHash?: boolean;
  emptyText?: string;
  /** DM などでヘッダに出す相手のアバター（省略時は出さない）。 */
  headerAvatar?: { displayName: string; avatarColor: string };
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 表示時・メッセージ追加時に最下部へ
  // biome-ignore lint/correctness/useExhaustiveDependencies: メッセージが差し替わったらスクロール位置を戻すための依存
  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

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
    <main id="app-main" className="app-main" aria-label={title}>
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
          <span role="img" aria-label="メンバー" className="message-header-icon">
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
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="pane-scroll message-scroll">
        {messages.length === 0 ? (
          <p className="message-empty">{emptyText}</p>
        ) : (
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
                  grouped={row.grouped}
                  replyTarget={row.replyTarget}
                  time={formatTime(row.message.sentAt)}
                />
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useOptionalStory } from "@/components/common/story/story-provider";
import type { Message, MessageAuthor } from "@/lib/discord-like/types";
import { MessageAttachments } from "./message-attachments";
import { MessageEmbeds } from "./message-embeds";

const POCHIBLO_URL = /https?:\/\/pochiblo\.jp(?:\/[^\s]*)?/g;

function renderMessageBody(body: string, onPochibloClick?: () => void) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of body.matchAll(POCHIBLO_URL)) {
    const url = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(body.slice(lastIndex, index));
    }
    const subPath = url.replace(/^https?:\/\/pochiblo\.jp/, "");
    const href = subPath && subPath !== "/" ? `/pochiblo${subPath}` : "/pochiblo";
    nodes.push(
      <Link
        key={`${index}-${url}`}
        href={href}
        className="message-link text-(--color-accent-fg) underline"
        onClick={onPochibloClick}
      >
        {url}
      </Link>,
    );
    lastIndex = index + url.length;
  }
  if (lastIndex === 0) {
    return body;
  }
  if (lastIndex < body.length) {
    nodes.push(body.slice(lastIndex));
  }
  return nodes;
}

/**
 * 1件のメッセージ行。grouped（同一作者が5分以内に連続発言）のときは
 * アバター・名前・時刻を省き、本文だけをインデントして出す。
 */
export function MessageRow({
  message,
  authors,
  grouped,
  replyTarget,
  time,
  focused = false,
}: {
  message: Message;
  /** サーバーから渡された書き手情報（クライアントはデータ層を import しない） */
  authors: Record<string, MessageAuthor>;
  grouped: boolean;
  replyTarget: Message | undefined;
  time: string;
  /** 検索結果からジャンプしてきた1件（強調表示する） */
  focused?: boolean;
}) {
  const story = useOptionalStory();
  const author = authors[message.authorId];
  const displayName = author?.displayName ?? message.authorId;
  const hasReply = Boolean(message.replyToId);
  const replyName = replyTarget
    ? (authors[replyTarget.authorId]?.displayName ?? replyTarget.authorId)
    : null;
  const onDendenLinkClick =
    message.authorId === "denden" ? () => story?.setFlag("s05-old-discord-user") : undefined;

  return (
    <article
      className="message"
      data-message-id={message.id}
      data-grouped={grouped ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
    >
      {grouped ? null : (
        <span
          aria-hidden="true"
          className="message-avatar"
          style={{ backgroundColor: author?.avatarColor ?? "transparent" }}
        >
          {displayName.slice(0, 1)}
        </span>
      )}

      <div className="message-main">
        {hasReply ? (
          <p className="message-reply">
            <span aria-hidden="true">↳</span>
            {replyTarget && replyName ? (
              <>
                <span className="message-reply-author">{replyName}</span>
                <span className="message-reply-body">
                  {replyTarget.body.replace(/\s+/g, " ").slice(0, 120)}
                </span>
              </>
            ) : (
              <span className="message-reply-missing">返信先のメッセージが見つかりません</span>
            )}
          </p>
        ) : null}

        {grouped ? null : (
          <p className="message-meta">
            {author?.profileUrl ? (
              // プロフィールのリンクがある書き手だけ、名前をリンクにする（新しい画面は作らない）
              <Link className="message-author" href={author.profileUrl} onClick={onDendenLinkClick}>
                {displayName}
              </Link>
            ) : (
              <span className="message-author">{displayName}</span>
            )}
            <time className="message-time" dateTime={message.sentAt}>
              {time}
            </time>
            {message.editedAt ? <span className="message-edited">(編集済み)</span> : null}
          </p>
        )}

        <p className="message-body" data-system={message.system ? "true" : undefined}>
          {message.pinned ? (
            <span role="img" aria-label="ピン留め" title="ピン留め" className="message-pin">
              📌
            </span>
          ) : null}
          {renderMessageBody(message.body, onDendenLinkClick)}
          {grouped && message.editedAt ? <span className="message-edited"> (編集済み)</span> : null}
        </p>

        <MessageEmbeds body={message.body} />

        {message.attachments && message.attachments.length > 0 ? (
          <MessageAttachments attachments={message.attachments} />
        ) : null}

        {message.reactions && message.reactions.length > 0 ? (
          <div className="message-reactions">
            {message.reactions.map((reaction) => (
              // クリックしても何も起きない（リアクション操作は #8 の非対象）
              <span
                key={`${message.id}-${reaction.emoji}-${reaction.count}`}
                role="img"
                className="reaction"
                data-me={reaction.me ? "true" : undefined}
                aria-label={`${reaction.emoji} ${reaction.count}件${reaction.me ? "（自分がリアクション済み）" : ""}`}
              >
                <span aria-hidden="true">{reaction.emoji}</span>
                <span aria-hidden="true">{reaction.count}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

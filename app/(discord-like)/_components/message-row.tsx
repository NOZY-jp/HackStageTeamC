"use client";

import { getUser } from "@/lib/discord-like";
import type { Message } from "@/lib/discord-like/types";
import { MessageAttachments } from "./message-attachments";

/**
 * 1件のメッセージ行。grouped（同一作者が5分以内に連続発言）のときは
 * アバター・名前・時刻を省き、本文だけをインデントして出す。
 */
export function MessageRow({
  message,
  grouped,
  replyTarget,
  time,
}: {
  message: Message;
  grouped: boolean;
  replyTarget: Message | undefined;
  time: string;
}) {
  const author = getUser(message.authorId);
  const displayName = author?.displayName ?? message.authorId;
  const hasReply = Boolean(message.replyToId);
  const replyName = replyTarget
    ? (getUser(replyTarget.authorId)?.displayName ?? replyTarget.authorId)
    : null;

  return (
    <article
      className="message"
      data-message-id={message.id}
      data-grouped={grouped ? "true" : undefined}
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
            <span className="message-author">{displayName}</span>
            <time className="message-time" dateTime={message.sentAt}>
              {time}
            </time>
            {message.editedAt ? <span className="message-edited">(編集済み)</span> : null}
          </p>
        )}

        <p className="message-body" data-system={message.system ? "true" : undefined}>
          {message.body}
          {grouped && message.editedAt ? <span className="message-edited"> (編集済み)</span> : null}
        </p>

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

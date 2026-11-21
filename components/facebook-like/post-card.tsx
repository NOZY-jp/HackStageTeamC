"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { getUserById } from "@/lib/facebook-like";
import type { FbPost, FbPostAttachment, FbReactionType } from "@/lib/facebook-like/types";
import { FbAvatar } from "./avatar";
import { useFacebook } from "./facebook-context";
import {
  formatFbDateTime,
  getTopReactionEmojis,
  getTotalReactionCount,
  REACTION_META,
} from "./format";
import { CommentIcon, GlobeIcon, ShareIcon, ThumbUpIcon, UsersIcon } from "./icons";

const REACTION_TYPES: FbReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"];

/**
 * 投稿に付いた写真・リンク。
 * 写真は画像があれば画像だけを出す（画像が未用意のあいだは、題名入りの仮の枠）。リンクはリンクカードにする
 */
function PostAttachment({ attachment }: { attachment: FbPostAttachment }) {
  if (attachment.kind === "photo") {
    return attachment.src ? (
      <Image
        src={attachment.src}
        alt={attachment.alt ?? attachment.title}
        width={attachment.width ?? 800}
        height={attachment.height ?? 600}
        unoptimized
        className="fb-photo"
      />
    ) : (
      <div
        className="fb-photo-placeholder"
        role="img"
        aria-label={attachment.alt ?? attachment.title}
      >
        {attachment.title}
      </div>
    );
  }
  return (
    <div className="fb-link-card">
      <div
        className="fb-link-card-thumb"
        style={{ backgroundColor: attachment.accentColor ?? "var(--fb-hover)" }}
        aria-hidden="true"
      />
      <div className="fb-link-card-body">
        {attachment.subtitle ? (
          <div className="fb-link-card-site">{attachment.subtitle}</div>
        ) : null}
        <div className="fb-link-card-title">{attachment.title}</div>
      </div>
    </div>
  );
}

type PostCardProps = {
  post: FbPost;
  showAllComments?: boolean;
};

export function PostCard({ post, showAllComments = false }: PostCardProps) {
  const { selfUser, toggleReaction, addComment, incrementShare } = useFacebook();
  const [commentText, setCommentText] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const author = getUserById(post.authorId);
  if (!author) {
    return null;
  }

  const totalReactions = getTotalReactionCount(post.reactions);
  const topEmojis = getTopReactionEmojis(post.reactions);
  const visibleComments = showAllComments ? post.comments : post.comments.slice(-2);

  const handleCommentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      return;
    }
    addComment(post.id, commentText);
    setCommentText("");
  };

  const activeReactionMeta = post.myReaction ? REACTION_META[post.myReaction] : null;

  return (
    <article className="fb-card" aria-label={`${author.displayName}の投稿`}>
      <div className="p-4 pb-3 flex items-start gap-3">
        <Link href={`/talkup/profile/${author.handle}`} className="shrink-0">
          <FbAvatar
            displayName={author.displayName}
            avatarColor={author.avatarColor}
            status={author.status}
            size="md"
            showStatus
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <Link
              href={`/talkup/profile/${author.handle}`}
              className="font-semibold hover:underline"
            >
              {author.displayName}
            </Link>
            {author.bot ? <span className="fb-bot-badge">BOT</span> : null}
            {post.feeling ? (
              <span className="text-[var(--fb-muted)] text-xs">― {post.feeling}な気分</span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--fb-muted)] mt-0.5">
            <Link href={`/talkup/post/${post.id}`} className="hover:underline">
              <time dateTime={post.createdAt}>{formatFbDateTime(post.createdAt)}</time>
            </Link>
            <span aria-hidden="true">·</span>
            <span title={post.audience === "public" ? "公開" : "友達のみ"}>
              {post.audience === "public" ? (
                <GlobeIcon className="w-3.5 h-3.5 inline" />
              ) : (
                <UsersIcon className="w-3.5 h-3.5 inline" />
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
        {post.body}
      </div>

      {post.attachment ? <PostAttachment attachment={post.attachment} /> : null}

      <div className="px-4 py-2 flex items-center justify-between text-xs text-[var(--fb-muted)] border-b border-[var(--fb-border)] mx-4">
        <div className="flex items-center gap-1.5">
          {topEmojis.length > 0 ? (
            <span className="tracking-tighter text-sm" aria-hidden="true">
              {topEmojis.join("")}
            </span>
          ) : null}
          <span>
            {totalReactions > 0
              ? `${totalReactions}件のリアクション`
              : "リアクションはまだありません"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/talkup/post/${post.id}`} className="hover:underline">
            コメント {post.comments.length}件
          </Link>
          <span>シェア {post.shares}件</span>
        </div>
      </div>

      <div className="px-2 py-1 grid grid-cols-3 gap-1 relative">
        <fieldset
          className="relative border-0 p-0 m-0 min-w-0"
          aria-label="リアクション"
          onMouseEnter={() => setShowPicker(true)}
          onMouseLeave={() => setShowPicker(false)}
        >
          {showPicker ? (
            <div className="fb-reaction-picker" role="toolbar" aria-label="リアクションを選択">
              {REACTION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    toggleReaction(post.id, type);
                    setShowPicker(false);
                  }}
                  className="fb-reaction-emoji-btn"
                  title={REACTION_META[type].label}
                  aria-label={REACTION_META[type].label}
                >
                  {REACTION_META[type].emoji}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => toggleReaction(post.id, post.myReaction ?? "like")}
            className={`fb-action-btn w-full ${post.myReaction ? "is-active" : ""}`}
            aria-pressed={Boolean(post.myReaction)}
          >
            {activeReactionMeta ? (
              <>
                <span aria-hidden="true">{activeReactionMeta.emoji}</span>
                <span>{activeReactionMeta.label}</span>
              </>
            ) : (
              <>
                <ThumbUpIcon className="w-4 h-4" />
                <span>いいね！</span>
              </>
            )}
          </button>
        </fieldset>

        <Link href={`/talkup/post/${post.id}`} className="fb-action-btn">
          <CommentIcon className="w-4 h-4" />
          <span>コメントする</span>
        </Link>

        <button type="button" onClick={() => incrementShare(post.id)} className="fb-action-btn">
          <ShareIcon className="w-4 h-4" />
          <span>シェア</span>
        </button>
      </div>

      <div className="px-4 pt-2 pb-3 border-t border-[var(--fb-border)] space-y-2.5">
        {!showAllComments && post.comments.length > 2 ? (
          <Link
            href={`/talkup/post/${post.id}`}
            className="text-xs font-semibold text-[var(--fb-muted)] hover:underline block"
          >
            すべてのコメント（{post.comments.length}件）を表示
          </Link>
        ) : null}

        {visibleComments.map((comment) => {
          const commentAuthor = getUserById(comment.authorId);
          if (!commentAuthor) {
            return null;
          }
          return (
            <div key={comment.id} className="flex items-start gap-2">
              <Link href={`/talkup/profile/${commentAuthor.handle}`} className="shrink-0 mt-0.5">
                <FbAvatar
                  displayName={commentAuthor.displayName}
                  avatarColor={commentAuthor.avatarColor}
                  size="sm"
                />
              </Link>
              <div className="min-w-0">
                <div className="fb-comment-bubble">
                  <Link
                    href={`/talkup/profile/${commentAuthor.handle}`}
                    className="font-semibold text-xs hover:underline block"
                  >
                    {commentAuthor.displayName}
                  </Link>
                  <p className="text-sm break-words">{comment.body}</p>
                </div>
                <div className="text-[11px] text-[var(--fb-muted)] px-3 mt-0.5">
                  <time dateTime={comment.createdAt}>{formatFbDateTime(comment.createdAt)}</time>
                </div>
              </div>
            </div>
          );
        })}

        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-1">
          <FbAvatar
            displayName={selfUser.displayName}
            avatarColor={selfUser.avatarColor}
            size="sm"
          />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="コメントを入力..."
            aria-label="コメントを入力"
            className="fb-comment-input"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="text-xs font-semibold text-[var(--fb-accent)] disabled:opacity-40 px-2 py-1"
          >
            送信
          </button>
        </form>
      </div>
    </article>
  );
}

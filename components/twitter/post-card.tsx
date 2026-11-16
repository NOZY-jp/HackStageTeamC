import Link from "next/link";
import type { Post, User } from "@/lib/mock/types";
import { Avatar } from "./avatar";
import { formatCount, formatPostedAt } from "./format";
import { ChatIcon, HeartIcon, RepostIcon } from "./icons";

/** カウントは 3 つとも表示専用（押せない）。読み上げ用に件数と名称を持たせる。 */
export function PostStats({ post }: { post: Post }) {
  return (
    <ul className="tw-stats" aria-label="反応">
      <li className="tw-stat" data-kind="reply">
        <ChatIcon />
        <span className="sr-only">返信 </span>
        <span>{formatCount(post.replyCount)}</span>
      </li>
      <li className="tw-stat" data-kind="repost">
        <RepostIcon />
        <span className="sr-only">リポスト </span>
        <span>{formatCount(post.repostCount)}</span>
      </li>
      <li className="tw-stat" data-kind="like">
        <HeartIcon />
        <span className="sr-only">いいね </span>
        <span>{formatCount(post.likeCount)}</span>
      </li>
    </ul>
  );
}

/**
 * タイムライン用の投稿カード。
 * 時刻リンクを ::after でカード全体に広げ、カードのどこを押しても詳細へ行ける。
 * アバター・名前・handle のリンクは z-index で前に出し、プロフィールへ行ける（a の入れ子を避ける）。
 */
export function PostCard({ post, author, replyTo }: { post: Post; author: User; replyTo?: User }) {
  const profileHref = `/twitter/profile/${author.handle}`;
  return (
    <article className="tw-post" aria-label={`${author.displayName}の投稿`}>
      <Link href={profileHref} className="tw-post-avatar" tabIndex={-1} aria-hidden="true">
        <Avatar user={author} />
      </Link>
      <div className="tw-post-main">
        <header className="tw-post-head">
          <Link href={profileHref} className="tw-name">
            {author.displayName}
          </Link>
          <Link href={profileHref} className="tw-handle">
            @{author.handle}
          </Link>
          <span aria-hidden="true" className="tw-dot">
            ·
          </span>
          <Link href={`/twitter/post/${post.id}`} className="tw-time tw-card-link">
            <time dateTime={post.postedAt}>{formatPostedAt(post.postedAt)}</time>
          </Link>
        </header>
        {replyTo ? (
          <p className="tw-replying">
            返信先:{" "}
            <Link href={`/twitter/profile/${replyTo.handle}`} className="tw-inline-link">
              @{replyTo.handle}
            </Link>
          </p>
        ) : null}
        <p className="tw-body">{post.body}</p>
        <PostStats post={post} />
      </div>
    </article>
  );
}

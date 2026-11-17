import Link from "next/link";
import { twitterViewCounts } from "@/lib/twitter-like/data/twitter";
import type { Post, TwitterUser } from "@/lib/twitter-like/types";
import { Avatar } from "./avatar";
import { formatCount, formatPostedDate } from "./format";
import {
  BookmarkIcon,
  ChatIcon,
  HeartIcon,
  RepostIcon,
  ShareIcon,
  VerifiedBadge,
  ViewsIcon,
} from "./icons";
import { isVerified } from "./lookup";

/** カウントはすべて表示専用（押せない）。読み上げ用に件数と名称を持たせる。 */
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
      <li className="tw-stat" data-kind="views">
        <ViewsIcon />
        <span className="sr-only">表示数 </span>
        <span>{formatCount(twitterViewCounts[post.id] ?? 0)}</span>
      </li>
      <li className="tw-stat-end">
        <span className="tw-stat" data-kind="bookmark">
          <BookmarkIcon />
          <span className="sr-only">ブックマーク</span>
        </span>
        <span className="tw-stat" data-kind="share">
          <ShareIcon />
          <span className="sr-only">共有</span>
        </span>
      </li>
    </ul>
  );
}

/**
 * タイムライン用の投稿カード。
 * 時刻リンクを ::after でカード全体に広げ、カードのどこを押しても詳細へ行ける。
 * アバター・名前・handle のリンクは z-index で前に出し、プロフィールへ行ける（a の入れ子を避ける）。
 * thread に "up" / "down" / "updown" を渡すと avatar をつなぐ縦線を描く。
 */
export function PostCard({
  post,
  author,
  replyTo,
  thread,
}: {
  post: Post;
  author: TwitterUser;
  replyTo?: TwitterUser;
  thread?: "up" | "down" | "updown";
}) {
  const profileHref = `/twitter/profile/${author.handle}`;
  return (
    <article className="tw-post" data-thread={thread} aria-label={`${author.displayName}の投稿`}>
      <Link href={profileHref} className="tw-post-avatar" tabIndex={-1} aria-hidden="true">
        <Avatar user={author} />
      </Link>
      <div className="tw-post-main">
        <header className="tw-post-head">
          <Link href={profileHref} className="tw-name">
            {author.displayName}
          </Link>
          {isVerified(author) ? <VerifiedBadge /> : null}
          <Link href={profileHref} className="tw-handle">
            @{author.handle}
          </Link>
          <span aria-hidden="true" className="tw-dot">
            ·
          </span>
          <Link href={`/twitter/post/${post.id}`} className="tw-time tw-card-link">
            <time dateTime={post.postedAt}>{formatPostedDate(post.postedAt)}</time>
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
        <p className="tw-post-body">{post.body}</p>
        <PostStats post={post} />
      </div>
    </article>
  );
}

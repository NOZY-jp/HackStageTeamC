import Link from "next/link";
import { twitterViewCounts } from "@/lib/twitter-like/data/twitter";
import type { Post, TwitterUser } from "@/lib/twitter-like/types";
import { Avatar } from "./avatar";
import { formatCount, formatPostedAt } from "./format";
import { VerifiedBadge } from "./icons";
import { isVerified } from "./lookup";
import { PostStats } from "./post-card";

/**
 * 個別投稿ページの主役カード。大きめの本文と絶対時刻・表示数、件数の行を表示する。
 * thread に "up" を渡すと親の縦線を avatar へ繋ぐ。本文以下が全幅なので "down" は
 * 指定しても線を引かない（文字やアイコンと重なるため。本家も同じ扱い）。
 */
export function PostDetail({
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
  const views = twitterViewCounts[post.id] ?? 0;
  return (
    <article className="tw-detail" data-thread={thread} aria-label={`${author.displayName}の投稿`}>
      <header className="tw-detail-head">
        <Link href={profileHref} tabIndex={-1} aria-hidden="true">
          <Avatar user={author} />
        </Link>
        <div className="tw-detail-author">
          <Link href={profileHref} className="tw-name tw-detail-name">
            {author.displayName}
            {isVerified(author) ? <VerifiedBadge /> : null}
          </Link>
          <Link href={profileHref} className="tw-handle">
            @{author.handle}
          </Link>
        </div>
      </header>
      {replyTo ? (
        <p className="tw-replying">
          返信先:{" "}
          <Link href={`/twitter/profile/${replyTo.handle}`} className="tw-inline-link">
            @{replyTo.handle}
          </Link>
        </p>
      ) : null}
      <p className="tw-post-body tw-post-body-lg">{post.body}</p>
      <p className="tw-detail-time">
        <time dateTime={post.postedAt}>{formatPostedAt(post.postedAt)}</time>
        <span aria-hidden="true"> · </span>
        <strong className="tw-detail-views">{formatCount(views)}</strong> 件の表示
      </p>
      <ul className="tw-detail-counts" aria-label="反応の内訳">
        <li>
          <strong>{formatCount(post.replyCount)}</strong> 件の返信
        </li>
        <li>
          <strong>{formatCount(post.repostCount)}</strong> 件のリポスト
        </li>
        <li>
          <strong>{formatCount(post.likeCount)}</strong> 件のいいね
        </li>
      </ul>
      <PostStats post={post} />
    </article>
  );
}

import Link from "next/link";
import type { Post, User } from "@/lib/mock/types";
import { Avatar } from "./avatar";
import { formatPostedAt } from "./format";
import { PostStats } from "./post-card";

/** 個別投稿ページの主役カード。大きめの本文と絶対時刻を表示する。 */
export function PostDetail({
  post,
  author,
  replyTo,
}: {
  post: Post;
  author: User;
  replyTo?: User;
}) {
  const profileHref = `/twitter/profile/${author.handle}`;
  return (
    <article className="tw-detail" aria-label={`${author.displayName}の投稿`}>
      <header className="tw-detail-head">
        <Link href={profileHref} tabIndex={-1} aria-hidden="true">
          <Avatar user={author} size="lg" />
        </Link>
        <div className="tw-detail-author">
          <Link href={profileHref} className="tw-name">
            {author.displayName}
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
      </p>
      <PostStats post={post} />
    </article>
  );
}

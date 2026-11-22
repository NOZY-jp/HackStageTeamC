import Link from "next/link";
import { getPost, isProtected } from "@/lib/twitter-like";
import type { Post, TwitterUser } from "@/lib/twitter-like/types";
import { Avatar } from "./avatar";
import { LockIcon } from "./icons";
import { replyTargetAuthor, usersById } from "./lookup";
import { PostCard } from "./post-card";

export function SearchResults({
  query,
  tab,
  matchedUsers,
  matchedPosts,
}: {
  query: string;
  tab: string;
  matchedUsers: TwitterUser[];
  matchedPosts: Post[];
}) {
  if (!query) return <div className="tw-empty">キーワードを入力して検索してください。</div>;
  if (matchedUsers.length === 0 && matchedPosts.length === 0) {
    return (
      <div className="tw-empty">
        <p className="tw-empty-title">「{query}」に一致する結果はありません</p>
        <p className="tw-empty-sub">別のキーワードで検索してみてください。</p>
      </div>
    );
  }

  const users = usersById();
  return (
    <>
      {matchedUsers.length > 0 ? (
        <section aria-label="ユーザー">
          <h2 className="tw-card-title">ユーザー</h2>
          <ul>
            {matchedUsers.map((user) => (
              <li key={user.id} className="tw-suggest-item">
                <Link href={`/twitter/profile/${user.handle}`} className="tw-suggest">
                  <Avatar user={user} />
                  <span className="tw-suggest-text">
                    <span className="tw-name">
                      {user.displayName}
                      {isProtected(user) ? <LockIcon /> : null}
                    </span>
                    <span className="tw-handle">@{user.handle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {matchedPosts.length > 0 ? (
        <section aria-label="ポスト">
          <h2 className="tw-card-title">ポスト</h2>
          {matchedPosts.map((post) => {
            const author = users.get(post.authorId);
            return author ? (
              <PostCard
                key={post.id}
                post={post}
                author={author}
                replyTo={replyTargetAuthor(post, getPost, users)}
              />
            ) : null;
          })}
        </section>
      ) : tab === "user" ? null : (
        <div className="tw-empty">
          <p className="tw-empty-sub">「{query}」に一致するポストはありません</p>
        </div>
      )}
    </>
  );
}

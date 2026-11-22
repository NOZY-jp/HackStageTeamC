"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { getPost, searchPosts, searchUsers } from "@/lib/twitter-like";
import { Avatar } from "./avatar";
import { LockIcon } from "./icons";
import { replyTargetAuthor, usersById } from "./lookup";
import { PostCard } from "./post-card";

/**
 * 発見（foundBff）の成立後にだけ見える検索結果（#248）。
 * サーバーは発見前の結果だけを描画し、この差分は遅延チャンクで作る。
 * 差分は「発見前には出ていなかったもの」＝かのんのアカウントと、かのんの投稿だけ。
 */
export function SearchAfterDiscovery({
  query,
  tab,
  showUserHeading,
  showPostHeading,
  onCount,
}: {
  query: string;
  tab: string;
  /** 発見前の結果に見出しが無いときだけ、こちらで見出しを出す */
  showUserHeading: boolean;
  showPostHeading: boolean;
  onCount: (count: { users: number; posts: number }) => void;
}) {
  const users = useMemo(() => {
    if (tab !== "top" && tab !== "user") return [];
    return searchUsers(query, { foundBff: true }).filter((user) => user.id === "tw-kanon");
  }, [query, tab]);

  const posts = useMemo(() => {
    if (tab === "user") return [];
    return searchPosts(query, { foundBff: true })
      .filter((post) => post.authorId === "tw-kanon")
      .filter((post) => tab !== "media" || (post.media?.length ?? 0) > 0);
  }, [query, tab]);

  const userCount = users.length;
  const postCount = posts.length;

  useEffect(() => {
    onCount({ users: userCount, posts: postCount });
  }, [onCount, userCount, postCount]);

  if (userCount === 0 && postCount === 0) return null;

  const allUsers = usersById();

  return (
    <>
      {userCount > 0 ? (
        <section aria-label="ユーザー">
          {showUserHeading ? <h2 className="tw-card-title">ユーザー</h2> : null}
          <ul>
            {users.map((user) => (
              <li key={user.id} className="tw-suggest-item">
                <Link href={`/twitter/profile/${user.handle}`} className="tw-suggest">
                  <Avatar user={user} />
                  <span className="tw-suggest-text">
                    <span className="tw-name">
                      {user.displayName}
                      {user.protected ? <LockIcon /> : null}
                    </span>
                    <span className="tw-handle">@{user.handle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {postCount > 0 ? (
        <section aria-label="ポスト">
          {showPostHeading ? <h2 className="tw-card-title">ポスト</h2> : null}
          {posts.map((post) => {
            const author = allUsers.get(post.authorId);
            return author ? (
              <PostCard
                key={post.id}
                post={post}
                author={author}
                replyTo={replyTargetAuthor(post, getPost, allUsers)}
              />
            ) : null;
          })}
        </section>
      ) : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FbAvatar } from "@/components/facebook-like/avatar";
import { useFacebook } from "@/components/facebook-like/facebook-context";
import { FacebookLeftSidebar } from "@/components/facebook-like/left-sidebar";
import { PostCard } from "@/components/facebook-like/post-card";
import { PostComposer } from "@/components/facebook-like/post-composer";
import { FacebookRightSidebar } from "@/components/facebook-like/right-sidebar";
import { filterPostsByQuery, searchFacebook } from "@/lib/facebook-like";

export default function FacebookFeedPage() {
  const { posts, searchQuery, setSearchQuery } = useFacebook();
  const query = searchQuery.trim();

  // URL の ?q= から始まる検索状態で、該当ユーザーと投稿だけを出す
  const matchedUsers = useMemo(() => (query ? searchFacebook(query).users : []), [query]);

  // 空白（半角・全角）を無視して照合する（「服部 由比」と「服部由比」の両方で届く）
  const filteredPosts = useMemo(() => filterPostsByQuery(posts, query), [posts, query]);

  return (
    <div className="fb-feed-grid">
      <FacebookLeftSidebar />

      <div className="fb-feed-center">
        <PostComposer />

        {query ? (
          <div className="fb-card px-4 py-2.5 flex items-center justify-between text-sm">
            <span>
              「<strong>{searchQuery}</strong>」の検索結果: ユーザー{matchedUsers.length}件 / 投稿
              {filteredPosts.length}件
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-[var(--fb-accent)] hover:underline"
            >
              クリア
            </button>
          </div>
        ) : null}

        {query && matchedUsers.length > 0 ? (
          <section className="fb-card p-4" aria-label="該当するユーザー">
            <h2 className="text-sm font-semibold mb-2">ユーザー</h2>
            <ul className="space-y-2">
              {matchedUsers.map((user) => (
                <li key={user.id}>
                  <Link
                    href={`/talkup/profile/${user.handle}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <FbAvatar
                      displayName={user.displayName}
                      avatarColor={user.avatarColor}
                      status={user.status}
                      size="sm"
                    />
                    <span>
                      <span className="block text-sm font-semibold">{user.displayName}</span>
                      <span className="block text-xs text-[var(--fb-muted)]">
                        @{user.handle}
                        {user.location ? ` · ${user.location}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="fb-card p-8 text-center text-sm text-[var(--fb-muted)]">
            該当する投稿が見つかりませんでした。
          </div>
        )}
      </div>

      <FacebookRightSidebar />
    </div>
  );
}

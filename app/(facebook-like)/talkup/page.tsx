"use client";

import { useMemo } from "react";
import { useFacebook } from "@/components/facebook-like/facebook-context";
import { FacebookLeftSidebar } from "@/components/facebook-like/left-sidebar";
import { PostCard } from "@/components/facebook-like/post-card";
import { PostComposer } from "@/components/facebook-like/post-composer";
import { FacebookRightSidebar } from "@/components/facebook-like/right-sidebar";
import { getUserById } from "@/lib/facebook-like";

export default function FacebookFeedPage() {
  const { posts, searchQuery, setSearchQuery } = useFacebook();

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return posts;
    }
    return posts.filter((post) => {
      const author = getUserById(post.authorId);
      const authorMatch =
        author?.displayName.toLowerCase().includes(q) || author?.handle.toLowerCase().includes(q);
      return post.body.toLowerCase().includes(q) || Boolean(authorMatch);
    });
  }, [posts, searchQuery]);

  return (
    <div className="fb-feed-grid">
      <FacebookLeftSidebar />

      <div className="fb-feed-center">
        <PostComposer />

        {searchQuery.trim() ? (
          <div className="fb-card px-4 py-2.5 flex items-center justify-between text-sm">
            <span>
              「<strong>{searchQuery}</strong>」の検索結果: {filteredPosts.length}件
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

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StoryAction } from "@/components/common/story/story-action";
import { useStoryOptional } from "@/components/common/story/story-provider";
import { FbAvatar } from "@/components/facebook-like/avatar";
import { useFacebook } from "@/components/facebook-like/facebook-context";
import { FacebookLeftSidebar } from "@/components/facebook-like/left-sidebar";
import { PostCard } from "@/components/facebook-like/post-card";
import { PostComposer } from "@/components/facebook-like/post-composer";
import { FacebookRightSidebar } from "@/components/facebook-like/right-sidebar";
import { filterFeedPosts, filterPostsByQuery, searchFacebook } from "@/lib/facebook-like";
import { canConfirmTalkup } from "./reveal";

/** 検索結果の絞り込み（すべて・人・投稿） */
type SearchFilter = "all" | "people" | "posts";
const SEARCH_FILTERS: { id: SearchFilter; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "people", label: "人" },
  { id: "posts", label: "投稿" },
];

export default function FacebookFeedPage() {
  const { posts, searchQuery, setSearchQuery } = useFacebook();
  const query = searchQuery.trim();
  const [filter, setFilter] = useState<SearchFilter>("all");

  // URL の ?q= から始まる検索状態で、該当ユーザーと投稿だけを出す
  const matchedUsers = useMemo(() => (query ? searchFacebook(query).users : []), [query]);
  const story = useStoryOptional();
  // 本人（u40）が結果に出ていて、カイの連絡の後だけ、確かめた操作を出せる
  const canConfirm = canConfirmTalkup(
    story?.state.flags ?? [],
    matchedUsers.map((user) => user.id),
  );

  // 通常のフィードでは u40（本名で捜す相手）の投稿を出さない。
  // 検索中は本人の投稿も結果に含める（検索とプロフィールからだけ見せる）。
  const feedPosts = useMemo(() => (query ? posts : filterFeedPosts(posts)), [posts, query]);

  // 空白（半角・全角）を無視して照合する（「服部 由比」と「服部由比」の両方で届く）
  const filteredPosts = useMemo(() => filterPostsByQuery(feedPosts, query), [feedPosts, query]);

  return (
    <div className="fb-feed-grid">
      <FacebookLeftSidebar />

      <div className="fb-feed-center">
        {query ? (
          <>
            {/* 検索中は投稿欄を出さず、検索結果の見出しと絞り込みを出す */}
            <div className="fb-card fb-search-head">
              <div className="fb-search-head-row">
                <h1 className="fb-search-title">「{searchQuery}」の検索結果</h1>
                <button type="button" onClick={() => setSearchQuery("")} className="fb-text-btn">
                  クリア
                </button>
              </div>
              <p className="fb-search-count">
                ユーザー{matchedUsers.length}件 / 投稿{filteredPosts.length}件
              </p>
              <fieldset className="fb-search-filters" aria-label="絞り込み">
                {SEARCH_FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={filter === item.id}
                    className="fb-chip"
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </fieldset>
              {/* 検索結果を本人と確かめた操作を記録する（#119） */}
              {canConfirm ? (
                <StoryAction flag="s10-talkup-match" className="fb-text-btn">
                  この人物で間違いない
                </StoryAction>
              ) : null}
            </div>

            {filter !== "posts" && matchedUsers.length > 0 ? (
              <section className="fb-card fb-people" aria-label="該当するユーザー">
                <h2 className="fb-section-title">人</h2>
                <ul className="fb-people-list">
                  {matchedUsers.map((user) => (
                    <li key={user.id}>
                      <Link href={`/talkup/profile/${user.handle}`} className="fb-person">
                        <FbAvatar
                          displayName={user.displayName}
                          avatarColor={user.avatarColor}
                          status={user.status}
                          size="lg"
                        />
                        <span className="fb-person-text">
                          <span className="fb-person-name">{user.displayName}</span>
                          <span className="fb-person-meta">
                            {[user.workplace, user.location ? `${user.location}在住` : undefined]
                              .filter(Boolean)
                              .join(" · ") || `@${user.handle}`}
                          </span>
                        </span>
                        <span className="fb-person-action" aria-hidden="true">
                          プロフィールを見る
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {filter !== "people" ? (
              filteredPosts.length > 0 ? (
                <>
                  <h2 className="fb-section-title fb-section-title-bare">投稿</h2>
                  {filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </>
              ) : (
                <div className="fb-card fb-empty">該当する投稿が見つかりませんでした。</div>
              )
            ) : null}
          </>
        ) : (
          <>
            <PostComposer />
            {feedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </>
        )}
      </div>

      <FacebookRightSidebar />
    </div>
  );
}

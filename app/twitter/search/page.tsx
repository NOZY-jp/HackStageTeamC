import type { Metadata } from "next";
import Link from "next/link";
import { StoryTrigger } from "@/components/common/story/story-trigger";
import { Avatar } from "@/components/twitter-like/avatar";
import { LockIcon, SearchIcon } from "@/components/twitter-like/icons";
import { replyTargetAuthor, usersById } from "@/components/twitter-like/lookup";
import { PageHeader } from "@/components/twitter-like/page-header";
import { PostCard } from "@/components/twitter-like/post-card";
import { RightSidebar } from "@/components/twitter-like/right-sidebar";
import { getPost, isProtected, searchPosts, searchUsers } from "@/lib/twitter-like";

export const metadata: Metadata = { title: "検索" };

export const instant = false;

type Props = { searchParams: Promise<{ q?: string | string[]; f?: string | string[] }> };

/** 検索のタブ（本家と同じく ?f= で切り替える）。話題はユーザーとポスト、最新はポストだけ */
const SEARCH_TABS = [
  { key: "top", label: "話題" },
  { key: "live", label: "最新" },
  { key: "user", label: "アカウント" },
  { key: "media", label: "メディア" },
] as const;
type SearchTab = (typeof SEARCH_TABS)[number]["key"];

function tabOf(value: string | string[] | undefined): SearchTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return SEARCH_TABS.find((tab) => tab.key === raw)?.key ?? "top";
}

/** /twitter/search?q=… の検索ページ。ユーザーとポストをまとめて出す。 */
export default async function TwitterSearchPage({ searchParams }: Props) {
  const { q, f } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : (q ?? "")).trim();
  const tab = tabOf(f);
  const users = usersById();
  const allUsers = query ? searchUsers(query) : [];
  const allPosts = query ? searchPosts(query) : [];
  const matchedUsers = tab === "top" || tab === "user" ? allUsers : [];
  const matchedPosts =
    tab === "user"
      ? []
      : tab === "media"
        ? allPosts.filter((post) => (post.media?.length ?? 0) > 0)
        : allPosts;

  return (
    <>
      {matchedPosts.some((p) => p.id === "post-102") ? <StoryTrigger flag="s02-bff-reply" /> : null}
      <main className="tw-main">
        <PageHeader title="検索" backHref="/twitter" />
        <form className="tw-search" action="/twitter/search">
          <SearchIcon />
          <input
            type="search"
            name="q"
            className="tw-search-input"
            placeholder="キーワードを検索"
            aria-label="検索キーワード"
            defaultValue={query}
          />
          {tab !== "top" ? <input type="hidden" name="f" value={tab} /> : null}
        </form>
        {query ? (
          <nav className="tw-tabs tw-search-tabs" aria-label="検索結果の切り替え">
            {SEARCH_TABS.map((item) => (
              <Link
                key={item.key}
                href={`/twitter/search?q=${encodeURIComponent(query)}${item.key === "top" ? "" : `&f=${item.key}`}`}
                className="tw-tab"
                data-active={item.key === tab || undefined}
                aria-current={item.key === tab ? "page" : undefined}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        ) : null}
        {query === "" ? (
          <div className="tw-empty">キーワードを入力して検索してください。</div>
        ) : matchedUsers.length === 0 && matchedPosts.length === 0 ? (
          <div className="tw-empty">
            <p className="tw-empty-title">「{query}」に一致する結果はありません</p>
            <p className="tw-empty-sub">別のキーワードで検索してみてください。</p>
          </div>
        ) : (
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
            {tab === "user" ? null : matchedPosts.length > 0 ? (
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
            ) : (
              <div className="tw-empty">
                <p className="tw-empty-sub">「{query}」の検索結果はありません</p>
              </div>
            )}
          </>
        )}
      </main>
      <RightSidebar hideSearch />
    </>
  );
}

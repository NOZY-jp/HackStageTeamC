import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/twitter-like/avatar";
import { SearchIcon, VerifiedBadge } from "@/components/twitter-like/icons";
import { isVerified, replyTargetAuthor, usersById } from "@/components/twitter-like/lookup";
import { PageHeader } from "@/components/twitter-like/page-header";
import { PostCard } from "@/components/twitter-like/post-card";
import { RightSidebar } from "@/components/twitter-like/right-sidebar";
import { getPost, searchPosts, searchUsers } from "@/lib/twitter-like";

export const metadata: Metadata = { title: "検索" };

export const instant = false;

type Props = { searchParams: Promise<{ q?: string | string[] }> };

/** /twitter/search?q=… の検索ページ。ユーザーとポストをまとめて出す。 */
export default async function TwitterSearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : (q ?? "")).trim();
  const users = usersById();
  const matchedUsers = query ? searchUsers(query) : [];
  const matchedPosts = query ? searchPosts(query) : [];

  return (
    <>
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
        </form>
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
                            {isVerified(user) ? <VerifiedBadge /> : null}
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
            ) : null}
          </>
        )}
      </main>
      <RightSidebar hideSearch />
    </>
  );
}

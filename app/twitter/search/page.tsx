import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { SearchIcon } from "@/components/twitter-like/icons";
import { PageHeader } from "@/components/twitter-like/page-header";
import { RightSidebar } from "@/components/twitter-like/right-sidebar";
import { SearchResults } from "@/components/twitter-like/search-results";
import { FOUND_BFF_COOKIE } from "@/lib/story/discovery-cookie";
import { searchPosts, searchUsers } from "@/lib/twitter-like";

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
  // 未発見のデータを初期配信物（HTML/RSC/JS）に載せないため、サーバー側で出し分ける（#248）
  const foundBff = (await cookies()).get(FOUND_BFF_COOKIE)?.value === "1";
  const options = { foundBff };
  const allUsers = query ? searchUsers(query, options) : [];
  const allPosts = query ? searchPosts(query, options) : [];
  const matchedUsers = tab === "top" || tab === "user" ? allUsers : [];
  const matchedPosts =
    tab === "user"
      ? []
      : tab === "media"
        ? allPosts.filter((post) => (post.media?.length ?? 0) > 0)
        : allPosts;

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
        <SearchResults
          query={query}
          tab={tab}
          matchedUsers={matchedUsers}
          matchedPosts={matchedPosts}
        />
      </main>
      <RightSidebar hideSearch />
    </>
  );
}

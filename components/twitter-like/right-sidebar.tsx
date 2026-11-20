import Link from "next/link";
import { HAL_HANDLE } from "@/lib/discord-like/data/names";
import { isProtected, listTrends, listUsers } from "@/lib/twitter-like";
import { Avatar } from "./avatar";
import { formatCount } from "./format";
import { SearchIcon } from "./icons";

export function RightSidebar({ hideSearch = false }: { hideSearch?: boolean }) {
  const trends = listTrends();
  const suggestions = listUsers()
    .filter((user) => user.handle !== HAL_HANDLE && !isProtected(user))
    .slice(0, 3);
  return (
    <aside className="tw-right" aria-label="サイドバー">
      {hideSearch ? null : (
        <form className="tw-search" action="/twitter/search">
          <SearchIcon />
          <input
            type="search"
            name="q"
            className="tw-search-input"
            placeholder="検索"
            aria-label="検索"
          />
        </form>
      )}
      <section className="tw-card" aria-labelledby="tw-trends-heading">
        <h2 id="tw-trends-heading" className="tw-card-title">
          いま話題
        </h2>
        <ul>
          {trends.map((trend) => (
            <li key={trend.id}>
              <Link
                href={`/twitter/search?q=${encodeURIComponent(trend.name)}`}
                className="tw-trend"
              >
                <span className="tw-trend-meta">{trend.category}</span>
                <span className="tw-trend-name">{trend.name}</span>
                <span className="tw-trend-meta">{formatCount(trend.postCount)} 件のポスト</span>
              </Link>
            </li>
          ))}
        </ul>
        <span className="tw-card-more" aria-disabled="true">
          さらに表示
        </span>
      </section>
      <section className="tw-card" aria-labelledby="tw-follow-heading">
        <h2 id="tw-follow-heading" className="tw-card-title">
          おすすめユーザー
        </h2>
        <ul>
          {suggestions.map((user) => (
            <li key={user.id} className="tw-suggest-item">
              <Link href={`/twitter/profile/${user.handle}`} className="tw-suggest">
                <Avatar user={user} />
                <span className="tw-suggest-text">
                  <span className="tw-name">{user.displayName}</span>
                  <span className="tw-handle">@{user.handle}</span>
                </span>
              </Link>
              <button type="button" className="tw-follow-button" disabled>
                フォロー
              </button>
            </li>
          ))}
        </ul>
        <span className="tw-card-more" aria-disabled="true">
          さらに表示
        </span>
      </section>
      <p className="tw-footer">Twixer デモ画面 · データはすべて架空です</p>
    </aside>
  );
}

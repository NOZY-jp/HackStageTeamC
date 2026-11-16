import Link from "next/link";
import { listTrends, listUsers } from "@/lib/mock";
import { Avatar } from "./avatar";
import { formatCount } from "./format";

export function RightSidebar() {
  const trends = listTrends();
  const suggestions = listUsers()
    .filter((user) => user.handle !== "hal")
    .slice(0, 3);
  return (
    <aside className="tw-right" aria-label="サイドバー">
      <div className="tw-search">
        <input
          type="search"
          className="tw-search-input"
          placeholder="検索（デモでは無効）"
          aria-label="検索（無効）"
          disabled
        />
      </div>
      <section className="tw-card" aria-labelledby="tw-trends-heading">
        <h2 id="tw-trends-heading" className="tw-card-title">
          トレンド
        </h2>
        <ul>
          {trends.map((trend) => (
            <li key={trend.id} className="tw-trend">
              <span className="tw-trend-meta">{trend.category}</span>
              <span className="tw-trend-name">{trend.name}</span>
              <span className="tw-trend-meta">{formatCount(trend.postCount)} 件のポスト</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="tw-card" aria-labelledby="tw-follow-heading">
        <h2 id="tw-follow-heading" className="tw-card-title">
          おすすめユーザー
        </h2>
        <ul>
          {suggestions.map((user) => (
            <li key={user.id}>
              <Link href={`/twitter/profile/${user.handle}`} className="tw-suggest">
                <Avatar user={user} />
                <span className="tw-suggest-text">
                  <span className="tw-name">{user.displayName}</span>
                  <span className="tw-handle">@{user.handle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

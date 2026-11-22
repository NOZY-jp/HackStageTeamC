import { searchPosts, searchUsers } from "@/lib/twitter-like";
import { SearchResults } from "./search-results";

/** 発見後は追加分を含む全件を、検索本来の順序で表示する。 */
export default function SearchAfterDiscovery({ query, tab }: { query: string; tab: string }) {
  const matchedUsers =
    tab === "top" || tab === "user" ? searchUsers(query, { foundBff: true }) : [];
  const posts = tab === "user" ? [] : searchPosts(query, { foundBff: true });
  const matchedPosts = tab === "media" ? posts.filter((post) => post.media?.length) : posts;

  return (
    <SearchResults
      query={query}
      tab={tab}
      matchedUsers={matchedUsers}
      matchedPosts={matchedPosts}
    />
  );
}

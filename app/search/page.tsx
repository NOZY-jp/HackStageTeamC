import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/search/search-view";
import { searchWeb } from "@/lib/search";

type Props = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Seek 検索",
};

async function SearchResults({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : (q ?? "")).trim();
  const results = query ? searchWeb(query) : [];
  return <SearchView query={query} results={results} />;
}

/** 作中の擬似検索エンジン "Seek" (`seek.jp`) ページ。 */
export default function SearchPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<SearchView query="" results={[]} loading />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

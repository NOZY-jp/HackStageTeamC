"use server";

import { runSearch, type SearchResponse } from "@/lib/discord-like/search";
import type { SearchOrder } from "@/lib/discord-like/search-query";

/**
 * メッセージ検索（#69）。モックデータ上の全文検索をサーバーで実行し、ヒットした行だけを返す。
 * インデックスは lib 側で1回だけ構築される（クライアントに全本文を置かないため Server Action）。
 */
export async function searchMessages(input: {
  query: string;
  order?: SearchOrder;
}): Promise<SearchResponse> {
  return runSearch({ query: input.query, order: input.order });
}

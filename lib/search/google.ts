import type { SearchResult } from "./index";

const PUBLIC_SEARCH_TERMS = [
  "写真",
  "写真 コンテスト",
  "フォトコンテスト",
  "写真 撮り方",
  "夜景",
  "夜景 撮り方",
  "モンハン",
  "モンハン 弓",
  "天気予報",
];

type OrganicResult = {
  title?: unknown;
  link?: unknown;
  snippet?: unknown;
};

function toSearchResult(entry: OrganicResult | null): SearchResult | undefined {
  if (typeof entry?.title !== "string" || typeof entry.link !== "string") return;

  const url = URL.parse(entry.link);
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return;

  return {
    id: `web:${url.href}`,
    kind: "web",
    title: entry.title,
    url: url.href,
    displayUrl: `${url.host}${url.pathname === "/" ? "" : url.pathname}`,
    siteName: url.hostname,
    snippet: typeof entry.snippet === "string" ? entry.snippet : "",
  };
}

/** Fetches Google's organic results from SearchApi on the server. */
export async function searchGoogle(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SEARCHAPI_API_KEY?.trim();
  const normalized = query.normalize("NFKC").trim().replace(/\s+/g, " ");
  const publicTerm = PUBLIC_SEARCH_TERMS.find((term) => term === normalized);
  if (!apiKey || !publicTerm) return [];

  const endpoint = new URL("https://www.searchapi.io/api/v1/search");
  endpoint.search = new URLSearchParams({
    engine: "google",
    q: publicTerm,
    gl: "jp",
    hl: "ja",
  }).toString();

  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
      redirect: "error",
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return [];

    const data: { organic_results?: (OrganicResult | null)[] } | null = await response.json();
    if (!Array.isArray(data?.organic_results)) return [];

    const results = new Map<string, SearchResult>();
    for (const entry of data.organic_results) {
      const result = toSearchResult(entry);
      if (result && !results.has(result.id)) results.set(result.id, result);
      if (results.size === 10) break;
    }
    return [...results.values()];
  } catch {
    return [];
  }
}

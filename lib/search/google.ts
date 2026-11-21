import type { SearchResult } from "./index";

const BOW_PUBLIC_QUERY = "モンハン 弓 属性強化";
const BOW_REFERENCES: SearchResult[] = [
  {
    id: "web:mhw-bow-builds",
    kind: "web",
    title: "モンハンワールドの弓装備とおすすめスキル",
    url: "https://game8.jp/mhw/199253",
    displayUrl: "game8.jp/mhw/199253",
    siteName: "ゲームエイト",
    snippet: "進行段階ごとの弓装備や、属性攻撃強化を組み込んだ装備構成を紹介。",
  },
  {
    id: "web:mhw-bow-tree",
    kind: "web",
    title: "モンハンワールドの弓一覧と強化派生",
    url: "https://monsterhunter.jp/world/weapon/bow/top/",
    displayUrl: "monsterhunter.jp/world/weapon/bow/top/",
    siteName: "攻略の虎",
    snippet: "各弓の攻撃力、属性値、使用できるビンを比較できる武器一覧。",
  },
  {
    id: "web:mhw-bow-introduction",
    kind: "web",
    title: "『モンスターハンター：ワールド』弓の武器紹介",
    url: "https://www.youtube.com/watch?v=HkiPXvwSbW0",
    displayUrl: "youtube.com/watch?v=HkiPXvwSbW0",
    siteName: "カプコン",
    snippet: "弓のアクションを映像で確認できる公式の武器紹介動画。",
  },
];

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

export async function searchExternalWeb(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SEARCHAPI_API_KEY?.trim();
  const normalized = query.normalize("NFKC").trim().replace(/\s+/g, " ");
  const isBowQuery =
    normalized === BOW_PUBLIC_QUERY || normalized.replaceAll(" ", "").startsWith("弓属性強化");
  const publicTerm = isBowQuery
    ? BOW_PUBLIC_QUERY
    : PUBLIC_SEARCH_TERMS.find((term) => term === normalized);
  const results = apiKey && publicTerm ? await searchGoogle(publicTerm, apiKey) : [];
  return isBowQuery && results.length === 0 ? BOW_REFERENCES : results;
}

async function searchGoogle(publicTerm: string, apiKey: string): Promise<SearchResult[]> {
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

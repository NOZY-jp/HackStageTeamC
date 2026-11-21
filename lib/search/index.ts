import {
  BLOG_SERVICE_NAME,
  blogPath,
  type EntryBlock,
  entryPath,
  listBlogs,
  listPublicEntries,
} from "@/lib/blog-like";
import { toDisplayUrl } from "@/lib/browser/url-map";
import {
  type ArticleBlock,
  articleHref,
  creatorHref,
  getCreator,
  SERVICE_NAME as LEAF_SERVICE_NAME,
  listArticles,
  listCreators,
} from "@/lib/note-like";
import { dmListPath } from "@/lib/platform/app-prefix";
import { PHOTO_CONTEST_NAME, PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";

/**
 * 作中の擬似検索エンジン "Seek" (`seek.jp`) の検索インデックスと検索処理。
 *
 * 公開情報のみを検索対象とする:
 * - 公開ブログトップ・公開記事（本文・公開コメント）
 * - 写真コンテスト結果ページ（本名・禁止語はインデックスに含めない）
 * - leaf クリエイター・公開記事
 * - サービス公式トップ（サービス名・ドメイン検索時のみ一致）
 *
 * 限定公開ブログ記事、マイリスト、Discord メッセージ、Twixer 鍵アカウント・投稿、
 * Talkup の非公開・探索対象アカウントは一切インデックスしない。
 */

export type SearchResultKind =
  | "blog"
  | "blog-entry"
  | "contest"
  | "note-creator"
  | "note-article"
  | "service";

export type SearchDocument = {
  id: string;
  kind: SearchResultKind;
  title: string;
  primaryTitle: string;
  url: string;
  displayUrl: string;
  summary: string;
  siteName: string;
  keywords: string[];
  chunks: string[];
  /** サービス公式トップ専用: サービス名・ドメイン検索でのみ一致させるための別名 */
  serviceAliases?: string[];
  publishedAt?: string;
};

export type SearchResult = {
  id: string;
  kind: SearchResultKind | "web";
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  siteName: string;
  publishedAt?: string;
};

function normalizeText(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

function stripSpaces(value: string): string {
  return normalizeText(value).replace(/\s+/g, "");
}

function extractBlogBlockText(block: EntryBlock): string {
  switch (block.kind) {
    case "paragraph":
    case "heading":
      return block.text;
    case "image":
      return [block.alt, block.caption ?? ""].filter(Boolean).join(" ");
    case "link":
      return [block.lead, block.label ?? "", block.url].filter(Boolean).join(" ");
  }
}

function extractNoteBlockText(block: ArticleBlock): string {
  switch (block.kind) {
    case "paragraph":
    case "heading":
    case "quote":
      return block.text;
    case "image":
      return [block.alt, block.caption ?? ""].filter(Boolean).join(" ");
    case "divider":
      return "";
  }
}

function buildBlogDocuments(): SearchDocument[] {
  const docs: SearchDocument[] = [];
  for (const blog of listBlogs()) {
    const blogUrl = blogPath(blog.id);
    docs.push({
      id: `blog:${blog.id}`,
      kind: "blog",
      title: `${blog.title} - ${BLOG_SERVICE_NAME}`,
      primaryTitle: blog.title,
      url: blogUrl,
      displayUrl: toDisplayUrl(blogUrl),
      summary: `${blog.description}（著者: ${blog.authorName}）`,
      siteName: BLOG_SERVICE_NAME,
      keywords: [
        blog.title,
        blog.description,
        blog.authorName,
        blog.authorProfile,
        BLOG_SERVICE_NAME,
        "攻略ブログ",
        "攻略",
        "ブログ",
        "ぽちブロ",
      ],
      chunks: [blog.description, blog.authorProfile],
    });

    for (const entry of listPublicEntries(blog.id)) {
      const url = entryPath(blog.id, entry.id);
      const bodyTexts = entry.body.map(extractBlogBlockText).filter(Boolean);
      const commentTexts = entry.comments.map(
        (comment) => `${comment.authorName}: ${comment.body}`,
      );
      const firstParagraph = entry.body.find((block) => block.kind === "paragraph");
      docs.push({
        id: `blog-entry:${blog.id}:${entry.id}`,
        kind: "blog-entry",
        title: `${entry.title} - ${blog.title}`,
        primaryTitle: entry.title,
        url,
        displayUrl: toDisplayUrl(url),
        summary: firstParagraph && "text" in firstParagraph ? firstParagraph.text : entry.title,
        siteName: BLOG_SERVICE_NAME,
        keywords: [
          blog.title,
          blog.authorName,
          BLOG_SERVICE_NAME,
          entry.category,
          "攻略ブログ",
          "ぽちブロ",
        ],
        chunks: [...bodyTexts, ...commentTexts],
        publishedAt: entry.publishedAt,
      });
    }
  }
  return docs;
}

function buildContestDocuments(): SearchDocument[] {
  return [
    {
      id: "contest:soukyuu-photo-award-2020",
      kind: "contest",
      title: `${PHOTO_CONTEST_NAME} 結果`,
      primaryTitle: `${PHOTO_CONTEST_NAME} 結果`,
      url: PHOTO_CONTEST_RESULT_PATH,
      displayUrl: toDisplayUrl(PHOTO_CONTEST_RESULT_PATH),
      summary: `「${PHOTO_CONTEST_NAME}」の結果ページ。優秀賞に「帰り道」（夕方の川沿いを写した作品）が選ばれました。`,
      siteName: PHOTO_CONTEST_NAME,
      keywords: [
        PHOTO_CONTEST_NAME,
        "写真コンテスト",
        "フォトアワード",
        "優秀賞",
        "受賞",
        "帰り道",
        "結果",
      ],
      chunks: [
        `「${PHOTO_CONTEST_NAME}」の結果が発表されました。`,
        "優秀賞 受賞作品「帰り道」。夕方の川沿いで、橋の向こうに沈む夕日を撮った一枚。",
      ],
    },
  ];
}

function buildNoteDocuments(): SearchDocument[] {
  const docs: SearchDocument[] = [];
  for (const creator of listCreators()) {
    const url = creatorHref(creator.id);
    docs.push({
      id: `note-creator:${creator.id}`,
      kind: "note-creator",
      title: `${creator.displayName}｜${LEAF_SERVICE_NAME}`,
      primaryTitle: creator.displayName,
      url,
      displayUrl: toDisplayUrl(url),
      summary: creator.bio,
      siteName: LEAF_SERVICE_NAME,
      keywords: [creator.displayName, creator.id, LEAF_SERVICE_NAME, "leaf.jp"],
      chunks: [creator.bio],
    });
  }

  for (const article of listArticles()) {
    const creator = getCreator(article.creatorId);
    const url = articleHref(article);
    const bodyTexts = article.body.map(extractNoteBlockText).filter(Boolean);
    docs.push({
      id: `note-article:${article.creatorId}:${article.id}`,
      kind: "note-article",
      title: `${article.title}｜${LEAF_SERVICE_NAME}`,
      primaryTitle: article.title,
      url,
      displayUrl: toDisplayUrl(url),
      summary: article.excerpt,
      siteName: LEAF_SERVICE_NAME,
      keywords: [
        creator?.displayName ?? "",
        article.creatorId,
        ...article.tags,
        LEAF_SERVICE_NAME,
        "leaf.jp",
      ].filter(Boolean),
      chunks: [article.excerpt, ...bodyTexts],
      publishedAt: article.publishedAt,
    });
  }
  return docs;
}

function buildServiceDocuments(): SearchDocument[] {
  const discordUrl = dmListPath();
  return [
    {
      id: "service:discord",
      kind: "service",
      title: "Discord - 会話やコミュニティが集まる場所",
      primaryTitle: "Discord",
      url: discordUrl,
      displayUrl: toDisplayUrl(discordUrl),
      summary:
        "ボイスチャンネルやテキストチャットで、ゲーム仲間やコミュニティとリアルタイムに話せるサービス。",
      siteName: "Discord",
      keywords: [],
      chunks: [],
      serviceAliases: ["discord", "discord.com", "ディスコード"],
    },
    {
      id: "service:twixer",
      kind: "service",
      title: "Twixer - いま起きていることを見つけよう",
      primaryTitle: "Twixer",
      url: "/twitter",
      displayUrl: toDisplayUrl("/twitter"),
      summary: "短いポストで近況や話題をやり取りできるリアルタイムSNS。",
      siteName: "Twixer",
      keywords: [],
      chunks: [],
      serviceAliases: ["twixer", "twixer.com", "ツイックスター", "twitter"],
    },
    {
      id: "service:leaf",
      kind: "service",
      title: `${LEAF_SERVICE_NAME} — 一枚ずつ、長い話を残しておける場所`,
      primaryTitle: LEAF_SERVICE_NAME,
      url: "/note",
      displayUrl: toDisplayUrl("/note"),
      summary: "日記、エッセイ、ゲームの攻略記事などを残して共有できるメディアプラットフォーム。",
      siteName: LEAF_SERVICE_NAME,
      keywords: [],
      chunks: [],
      serviceAliases: ["leaf", "leaf.jp", "リーフ", "note"],
    },
    {
      id: "service:talkup",
      kind: "service",
      title: "talkup - 友達や知り合いとつながろう",
      primaryTitle: "talkup",
      url: "/talkup",
      displayUrl: toDisplayUrl("/talkup"),
      summary: "実名やプロフィールで友人・知人・同級生とつながるコミュニティSNS。",
      siteName: "talkup",
      keywords: [],
      chunks: [],
      serviceAliases: ["talkup", "talkup.jp", "トークアップ"],
    },
  ];
}

/** Seek で検索可能なすべての公開ドキュメントを返す。 */
export function getIndexedDocuments(): SearchDocument[] {
  return [
    ...buildBlogDocuments(),
    ...buildContestDocuments(),
    ...buildNoteDocuments(),
    ...buildServiceDocuments(),
  ];
}

function splitTerms(query: string): string[] {
  return query
    .trim()
    .split(/[\s\u3000]+/)
    .map((term) => normalizeText(term))
    .filter(Boolean);
}

function includesNormalized(target: string, strippedTarget: string, term: string): boolean {
  const strippedTerm = stripSpaces(term);
  return (
    target.includes(term) || (strippedTerm.length > 0 && strippedTarget.includes(strippedTerm))
  );
}

const KIND_PRIORITY_BONUS: Record<SearchResultKind, number> = {
  contest: 300,
  blog: 240,
  "blog-entry": 220,
  "note-creator": 100,
  "note-article": 0,
  service: 0,
};

function scoreServiceDocument(doc: SearchDocument, terms: string[]): number {
  const aliases = doc.serviceAliases ?? [];
  const normalizedAliases = aliases.map((alias) => ({
    raw: normalizeText(alias),
    stripped: stripSpaces(alias),
  }));

  let score = 0;
  for (const term of terms) {
    const strippedTerm = stripSpaces(term);
    const matched = normalizedAliases.some((alias) => {
      if (alias.raw === term || alias.stripped === strippedTerm) {
        return true;
      }
      return (
        term.length >= 2 && (alias.raw.includes(term) || alias.stripped.includes(strippedTerm))
      );
    });
    if (!matched) {
      return 0;
    }
    const exact = normalizedAliases.some(
      (alias) => alias.raw === term || alias.stripped === strippedTerm,
    );
    score += exact ? 260 : 120;
  }
  return score;
}

function scoreDocument(doc: SearchDocument, query: string, terms: string[]): number {
  if (doc.kind === "service") {
    return scoreServiceDocument(doc, terms);
  }

  const normPrimaryTitle = normalizeText(doc.primaryTitle);
  const stripPrimaryTitle = stripSpaces(doc.primaryTitle);
  const normTitle = normalizeText(doc.title);
  const stripTitle = stripSpaces(doc.title);
  const normMeta = normalizeText([doc.displayUrl, doc.summary, ...doc.keywords].join("\n"));
  const stripMeta = stripSpaces([doc.displayUrl, doc.summary, ...doc.keywords].join("\n"));
  const normChunks = normalizeText(doc.chunks.join("\n"));
  const stripChunks = stripSpaces(doc.chunks.join("\n"));

  const normAll = `${normTitle}\n${normMeta}\n${normChunks}`;
  const stripAll = `${stripTitle}${stripMeta}${stripChunks}`;

  const strippedFullQuery = stripSpaces(query);
  if (!terms.every((term) => includesNormalized(normAll, stripAll, term))) {
    // 語同士が空白を跨いで連結される場合も、スペース除去全体一致で確認する
    if (!strippedFullQuery || !stripAll.includes(strippedFullQuery)) {
      return 0;
    }
  }

  let score = KIND_PRIORITY_BONUS[doc.kind];

  if (
    strippedFullQuery &&
    (stripPrimaryTitle === strippedFullQuery || stripTitle === strippedFullQuery)
  ) {
    score += 120;
  } else if (strippedFullQuery && stripPrimaryTitle.includes(strippedFullQuery)) {
    score += 70;
  } else if (strippedFullQuery && stripTitle.includes(strippedFullQuery)) {
    score += 45;
  }

  let allInTitle = true;
  for (const term of terms) {
    if (includesNormalized(normPrimaryTitle, stripPrimaryTitle, term)) {
      score += 35;
    } else if (includesNormalized(normTitle, stripTitle, term)) {
      score += 22;
    } else {
      allInTitle = false;
    }
    if (includesNormalized(normMeta, stripMeta, term)) {
      score += 10;
    }
    if (includesNormalized(normChunks, stripChunks, term)) {
      score += 4;
    }
  }

  if (allInTitle) {
    score += 30;
  }

  return score;
}

function buildSnippet(doc: SearchDocument, terms: string[]): string {
  const normSummary = normalizeText(doc.summary);
  const stripSummary = stripSpaces(doc.summary);
  if (terms.some((term) => includesNormalized(normSummary, stripSummary, term))) {
    return doc.summary;
  }

  for (const chunk of doc.chunks) {
    const normChunk = normalizeText(chunk);
    const stripChunk = stripSpaces(chunk);
    const matchedTerm = terms.find((term) => includesNormalized(normChunk, stripChunk, term));
    if (matchedTerm) {
      if (chunk.length <= 140) {
        return chunk;
      }
      const idx = normChunk.indexOf(matchedTerm);
      const start = Math.max(0, idx - 36);
      const end = Math.min(chunk.length, start + 140);
      const prefix = start > 0 ? "…" : "";
      const suffix = end < chunk.length ? "…" : "";
      return `${prefix}${chunk.slice(start, end)}${suffix}`;
    }
  }

  return doc.summary;
}

/** 公開ドキュメントをキーワード検索し、関連度順（タイトル一致優先）で返す。 */
export function searchWeb(query: string): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  const terms = splitTerms(trimmed);
  if (terms.length === 0) {
    return [];
  }

  const scored: { doc: SearchDocument; score: number; index: number }[] = [];
  const docs = getIndexedDocuments();
  for (let i = 0; i < docs.length; i += 1) {
    const doc = docs[i];
    const score = scoreDocument(doc, trimmed, terms);
    if (score > 0) {
      scored.push({ doc, score, index: i });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const dateCmp = (b.doc.publishedAt ?? "").localeCompare(a.doc.publishedAt ?? "");
    if (dateCmp !== 0) {
      return dateCmp;
    }
    return a.index - b.index;
  });

  return scored.map(({ doc }) => ({
    id: doc.id,
    kind: doc.kind,
    title: doc.title,
    url: doc.url,
    displayUrl: doc.displayUrl,
    snippet: buildSnippet(doc, terms),
    siteName: doc.siteName,
    publishedAt: doc.publishedAt,
  }));
}

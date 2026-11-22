import type { MetadataRoute } from "next";
import { listBlogs, listPublicEntries } from "@/lib/blog-like";
import {
  CONTEST_CONTACT_PATH,
  CONTEST_GUIDELINES_PATH,
  CONTEST_SITE_PATH,
} from "@/lib/contest-like/site";
import { articleHref, creatorHref, listArticles, listCreators } from "@/lib/note-like";
import { PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { SITE_URL } from "@/lib/seo/site";

/**
 * 検索に載せるのはブログと leaf（note）だけ。
 * ブログは「ブログ名」と「移設・閉鎖のお知らせ（公開記事）」だけを載せる。限定公開の記事は載せない
 * （人の決定 2026-11-20「ブログ名と移設しましたという記事だけヒットすればいい」）。
 * Discord・Twixer・talkup は物語の手がかりを含むので載せない。
 * サービス直下の /pochiblo は 404 なので含めない（記事一覧は /pochiblo/<blogId>）。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const blogPages: MetadataRoute.Sitemap = listBlogs().flatMap((blog) => [
    {
      url: `${SITE_URL}/pochiblo/${blog.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...listPublicEntries(blog.id).map((entry) => ({
      url: `${SITE_URL}/pochiblo/${blog.id}/entry/${entry.id}`,
      lastModified: entry.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ]);

  const notePages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/note`, changeFrequency: "daily" as const, priority: 0.9 },
    ...listCreators().map((creator) => ({
      url: `${SITE_URL}${creatorHref(creator.id)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...listArticles().map((article) => ({
      url: `${SITE_URL}${articleHref(article)}`,
      lastModified: article.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  // コンテストの結果ページ（サイト内リンクは張らず、sitemap 経由でだけ届く）
  // 写真コンテストの主催者サイト（#222）。結果発表で受賞者の本名に届く（#77 手順8）
  const contestPages: MetadataRoute.Sitemap = [
    CONTEST_SITE_PATH,
    CONTEST_GUIDELINES_PATH,
    PHOTO_CONTEST_RESULT_PATH,
    CONTEST_CONTACT_PATH,
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [...blogPages, ...contestPages, ...notePages];
}

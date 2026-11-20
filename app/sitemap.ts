import type { MetadataRoute } from "next";
import { listAllEntries, listBlogs } from "@/lib/blog-like";
import { articleHref, creatorHref, listArticles, listCreators } from "@/lib/note-like";
import { PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { SITE_URL } from "@/lib/seo/site";

/**
 * 検索に載せるのはブログと leaf（note）だけ。
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
    ...listAllEntries(blog.id).map((entry) => ({
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
  const contestPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}${PHOTO_CONTEST_RESULT_PATH}`,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
  ];

  return [...blogPages, ...contestPages, ...notePages];
}

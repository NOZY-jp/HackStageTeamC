import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * クロールは全ページ許可（物語の手がかりは sitemap に載せないだけで、robots では拒否しない）。
 * サイトマップの場所だけを宣言する。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

/** 本番サイトのURL（metadataBase・robots・sitemap で共有する）。 */
export const SITE_URL = "https://hack-stage-team-c.vercel.app";

/** サイト内パスを本番URLの絶対URLにする（canonical 用）。 */
export function canonicalUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

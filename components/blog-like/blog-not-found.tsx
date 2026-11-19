import { BLOG_SERVICE_NAME } from "@/lib/blog-like";

/** ぽちブロの「ブログが見つからない」ページ。 */
export function BlogNotFound() {
  return (
    <div className="pb-shell">
      <div className="pb-service-bar">
        <span className="pb-service-logo">{BLOG_SERVICE_NAME}</span>
        <span>無料ブログはぽちブロ</span>
      </div>
      <div className="pb-container pb-gone">
        <h1 className="pb-gone-title">ブログが見つかりません</h1>
        <p className="pb-gone-text">
          お探しのブログまたは記事は削除されたか、URLが間違っている可能性があります。
        </p>
        <p className="pb-gone-text">Powered by {BLOG_SERVICE_NAME}</p>
      </div>
    </div>
  );
}

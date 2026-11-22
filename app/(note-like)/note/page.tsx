import type { Metadata } from "next";
import { ArticleCard } from "@/components/note-like/article-card";
import { getCreator, listTopArticles, SERVICE_NAME } from "@/lib/note-like";
import { canonicalUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  // ルートのテンプレート（| HackStage）ではなく、leaf の名前で固定する
  title: { absolute: `新着記事｜${SERVICE_NAME}` },
  description: "leaf の新着記事一覧。一枚ずつ、長い話を残しておける場所です。",
  alternates: { canonical: canonicalUrl("/note") },
};

export default function NoteTopPage() {
  const articles = listTopArticles();

  return (
    <div className="note-page">
      <h1 className="note-page-title">新着記事</h1>
      {articles.length === 0 ? <p className="note-empty">まだ記事がありません。</p> : null}
      <div className="note-grid">
        {articles.map((article) => {
          const creator = getCreator(article.creatorId);
          return creator ? (
            <ArticleCard key={article.id} article={article} creator={creator} />
          ) : null;
        })}
      </div>
    </div>
  );
}

import { ArticleCard } from "@/components/note-like/article-card";
import { getCreator, listArticles } from "@/lib/note-like";

export default function NoteTopPage() {
  const articles = listArticles();

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

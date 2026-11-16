import { ArticleCard } from "@/components/note/article-card";
import { getCreator, listArticles } from "@/lib/note";

export default function NoteTopPage() {
  const articles = listArticles();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-lg font-bold">新着の記事</h1>
      {articles.length === 0 && (
        <p className="text-sm text-(--note-text-muted)">まだ記事がありません。</p>
      )}
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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

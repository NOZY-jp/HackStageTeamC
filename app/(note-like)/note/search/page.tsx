import type { Metadata } from "next";
import { Suspense } from "react";
import { ArticleListItem } from "@/components/note-like/article-list-item";
import { getCreator, searchArticles } from "@/lib/note-like";

type Props = PageProps<"/note/search">;

export const metadata: Metadata = { title: "検索" };

async function Results({ searchParams }: Pick<Props, "searchParams">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : (q ?? "")).trim();

  if (!query) {
    return <p className="note-empty">検索したい言葉を入力してください。</p>;
  }

  const articles = searchArticles(query);
  return (
    <>
      <h1 className="note-page-title" data-tight="true">
        「{query}」の検索結果
      </h1>
      <p className="note-empty">{articles.length}件</p>
      {articles.length === 0 ? (
        <p className="note-empty" data-spaced="true">
          一致する記事は見つかりませんでした。
        </p>
      ) : null}
      {articles.map((article) => (
        <ArticleListItem
          key={article.id}
          article={article}
          creator={getCreator(article.creatorId)}
        />
      ))}
    </>
  );
}

export default function SearchPage({ searchParams }: Props) {
  return (
    <div className="note-page" data-width="list">
      {/* 検索語はリクエストごとに変わるので、境界の中で読む */}
      <Suspense fallback={<p className="note-empty">検索中…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

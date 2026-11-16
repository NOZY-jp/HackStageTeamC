import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/note/article-card";
import { CreatorAvatar } from "@/components/note/creator-avatar";
import { getCreator, listArticlesByCreator, listCreators } from "@/lib/note";

type Props = PageProps<"/note/[creatorId]">;

export function generateStaticParams() {
  return listCreators().map((creator) => ({ creatorId: creator.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { creatorId } = await params;
  const creator = getCreator(creatorId);
  return creator ? { title: creator.displayName, description: creator.bio } : {};
}

export default async function CreatorPage({ params }: Props) {
  const { creatorId } = await params;
  const creator = getCreator(creatorId);
  if (!creator) notFound();

  const articles = listArticlesByCreator(creator.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="flex flex-col items-start gap-4 border-b border-(--note-line) pb-8 sm:flex-row sm:items-center sm:gap-6">
        <CreatorAvatar creator={creator} size="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{creator.displayName}</h1>
          <p className="mt-1 text-sm text-(--note-text-muted)">@{creator.id}</p>
          <p className="mt-3 text-sm leading-relaxed">{creator.bio}</p>
          <dl className="mt-3 flex gap-5 text-sm text-(--note-text-muted)">
            <div className="flex gap-1">
              <dt className="order-2">フォロー</dt>
              <dd className="font-bold text-(--note-text) tabular-nums">
                {creator.followingCount}
              </dd>
            </div>
            <div className="flex gap-1">
              <dt className="order-2">フォロワー</dt>
              <dd className="font-bold text-(--note-text) tabular-nums">{creator.followerCount}</dd>
            </div>
          </dl>
        </div>
      </section>

      <h2 className="mt-8 mb-6 text-lg font-bold">記事 {articles.length}本</h2>
      {articles.length === 0 && (
        <p className="text-sm text-(--note-text-muted)">まだ記事がありません。</p>
      )}
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} creator={creator} />
        ))}
      </div>
    </div>
  );
}

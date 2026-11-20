import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleListItem } from "@/components/note-like/article-list-item";
import { CreatorAvatar } from "@/components/note-like/creator-avatar";
import { creatorHref, getCreator, listArticlesByCreator, listCreators } from "@/lib/note-like";
import { canonicalUrl } from "@/lib/seo/site";

type Props = PageProps<"/note/[creatorId]">;

export function generateStaticParams() {
  return listCreators().map((creator) => ({ creatorId: creator.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { creatorId } = await params;
  const creator = getCreator(creatorId);
  if (!creator) {
    return {};
  }
  return {
    title: creator.displayName,
    description: creator.bio,
    alternates: { canonical: canonicalUrl(creatorHref(creator.id)) },
  };
}

export default async function CreatorPage({ params }: Props) {
  const { creatorId } = await params;
  const creator = getCreator(creatorId);
  if (!creator) {
    notFound();
  }

  const articles = listArticlesByCreator(creator.id);

  return (
    <div className="note-page" data-width="list">
      <section>
        <CreatorAvatar creator={creator} size="lg" />
        <h1 className="note-profile-name">{creator.displayName}</h1>
        <p className="note-profile-bio">{creator.bio}</p>
      </section>

      <h2 className="note-section-title">記事 {articles.length}本</h2>
      {articles.length === 0 ? (
        <p className="note-empty" data-spaced="true">
          まだ記事がありません。
        </p>
      ) : null}
      {articles.map((article) => (
        <ArticleListItem key={article.id} article={article} />
      ))}
    </div>
  );
}

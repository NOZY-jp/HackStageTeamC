import { Composer } from "@/components/twitter/composer";
import { replyTargetAuthor, usersById } from "@/components/twitter/lookup";
import { PageHeader } from "@/components/twitter/page-header";
import { PostCard } from "@/components/twitter/post-card";
import { getPost, listPosts } from "@/lib/mock";

export const metadata = { title: "ホーム" };

/** タイムラインはトップレベルの投稿のみ。返信は個別投稿ページとプロフィールに出す。 */
export default function TwitterTimelinePage() {
  const users = usersById();
  const posts = listPosts().filter((post) => !post.replyToId);
  const me = users.get("tw-hal");

  return (
    <>
      <PageHeader title="ホーム" />
      {me ? <Composer user={me} /> : null}
      <div>
        {posts.map((post) => {
          const author = users.get(post.authorId);
          return author ? (
            <PostCard
              key={post.id}
              post={post}
              author={author}
              replyTo={replyTargetAuthor(post, getPost, users)}
            />
          ) : null;
        })}
      </div>
    </>
  );
}

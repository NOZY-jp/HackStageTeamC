import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { replyTargetAuthor, usersById } from "@/components/twitter/lookup";
import { PageHeader } from "@/components/twitter/page-header";
import { PostCard } from "@/components/twitter/post-card";
import { PostDetail } from "@/components/twitter/post-detail";
import { getPost, listPosts, listReplies } from "@/lib/mock";

type Props = { params: Promise<{ postId: string }> };

export function generateStaticParams() {
  return listPosts().map((post) => ({ postId: post.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const post = getPost(postId);
  const author = post ? usersById().get(post.authorId) : undefined;
  return author ? { title: `${author.displayName}の投稿` } : { title: "投稿が見つかりません" };
}

export default async function TwitterPostPage({ params }: Props) {
  const { postId } = await params;
  const post = getPost(postId);
  if (!post) {
    notFound();
  }
  const users = usersById();
  const author = users.get(post.authorId);
  if (!author) {
    notFound();
  }
  const replies = listReplies(post.id);

  return (
    <>
      <PageHeader title="ポスト" backHref="/twitter" />
      <PostDetail post={post} author={author} replyTo={replyTargetAuthor(post, getPost, users)} />
      <section aria-label="返信">
        {replies.length === 0 ? <p className="tw-empty">まだ返信はありません。</p> : null}
        {replies.map((reply) => {
          const replyAuthor = users.get(reply.authorId);
          return replyAuthor ? (
            <PostCard key={reply.id} post={reply} author={replyAuthor} replyTo={author} />
          ) : null;
        })}
      </section>
    </>
  );
}

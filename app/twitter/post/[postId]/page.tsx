import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReplyComposer } from "@/components/twitter/composer";
import { replyTargetAuthor, usersById } from "@/components/twitter/lookup";
import { PageHeader } from "@/components/twitter/page-header";
import { PostCard } from "@/components/twitter/post-card";
import { PostDetail } from "@/components/twitter/post-detail";
import { RightSidebar } from "@/components/twitter/right-sidebar";
import { getPost, listPosts, listReplies } from "@/lib/mock";
import type { Post } from "@/lib/mock/types";

type Props = { params: Promise<{ postId: string }> };

export const instant = false;

export function generateStaticParams() {
  return listPosts().map((post) => ({ postId: post.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const post = getPost(postId);
  const author = post ? usersById().get(post.authorId) : undefined;
  return author ? { title: `${author.displayName}の投稿` } : { title: "投稿が見つかりません" };
}

/** 返信先のチェーンを古い順で集める（スレッドの接続線を引くため）。 */
function ancestorsOf(post: Post): Post[] {
  const ancestors: Post[] = [];
  let current = post;
  while (current.replyToId) {
    const parent = getPost(current.replyToId);
    if (!parent) {
      break;
    }
    ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
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
  const me = users.get("tw-hal");
  const ancestors = ancestorsOf(post);
  const replies = listReplies(post.id);
  const detailThread = [ancestors.length > 0 ? "up" : "", replies.length > 0 ? "down" : ""].join(
    "",
  ) as "up" | "down" | "updown" | undefined;

  return (
    <>
      <main className="tw-main">
        <PageHeader title="ポスト" backHref="/twitter" />
        {ancestors.map((ancestor) => {
          const ancestorAuthor = users.get(ancestor.authorId);
          return ancestorAuthor ? (
            <PostCard
              key={ancestor.id}
              post={ancestor}
              author={ancestorAuthor}
              replyTo={replyTargetAuthor(ancestor, getPost, users)}
              thread="down"
            />
          ) : null;
        })}
        <PostDetail
          post={post}
          author={author}
          replyTo={replyTargetAuthor(post, getPost, users)}
          thread={detailThread || undefined}
        />
        {me ? <ReplyComposer user={me} thread={replies.length > 0 ? "updown" : undefined} /> : null}
        <section aria-label="返信">
          {replies.length === 0 ? <p className="tw-empty">まだ返信はありません。</p> : null}
          {replies.map((reply, i) => {
            const replyAuthor = users.get(reply.authorId);
            return replyAuthor ? (
              <PostCard
                key={reply.id}
                post={reply}
                author={replyAuthor}
                replyTo={author}
                thread={i === replies.length - 1 ? "up" : "updown"}
              />
            ) : null;
          })}
        </section>
      </main>
      <RightSidebar />
    </>
  );
}

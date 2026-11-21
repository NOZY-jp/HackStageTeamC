import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryTrigger } from "@/components/common/story/story-trigger";
import { ReplyComposer } from "@/components/twitter-like/composer";
import { replyTargetAuthor, usersById } from "@/components/twitter-like/lookup";
import { PageHeader } from "@/components/twitter-like/page-header";
import { PostCard } from "@/components/twitter-like/post-card";
import { PostDetail } from "@/components/twitter-like/post-detail";
import { RightSidebar } from "@/components/twitter-like/right-sidebar";
import { getPost, listPosts, listReplies } from "@/lib/twitter-like";
import type { Post } from "@/lib/twitter-like/types";

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
      {post.id === "post-101" || post.id === "post-102" ? (
        <StoryTrigger flag="s02-bff-reply" />
      ) : null}
      <main className="tw-main">
        <PageHeader title="ポスト" backHref="/twitter" />
        {ancestors.map((ancestor, i) => {
          const ancestorAuthor = users.get(ancestor.authorId);
          return ancestorAuthor ? (
            <PostCard
              key={ancestor.id}
              post={ancestor}
              author={ancestorAuthor}
              replyTo={replyTargetAuthor(ancestor, getPost, users)}
              thread={i === 0 ? "down" : "updown"}
            />
          ) : null;
        })}
        <PostDetail
          post={post}
          author={author}
          replyTo={replyTargetAuthor(post, getPost, users)}
          thread={detailThread || undefined}
        />
        {me ? <ReplyComposer user={me} thread={replies.length > 0 ? "down" : undefined} /> : null}
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

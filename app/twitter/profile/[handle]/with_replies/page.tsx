import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { replyTargetAuthor, usersById } from "@/components/twitter-like/lookup";
import { PostCard } from "@/components/twitter-like/post-card";
import { ProfileEmpty, ProfileShell } from "@/components/twitter-like/profile-shell";
import { RightSidebar } from "@/components/twitter-like/right-sidebar";
import {
  getPost,
  getProfile,
  getUserByHandle,
  listPostsByAuthor,
  listUsers,
} from "@/lib/twitter-like";

type Props = { params: Promise<{ handle: string }> };

export const instant = false;

export function generateStaticParams() {
  return listUsers().map((user) => ({ handle: user.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = getUserByHandle(handle);
  return user
    ? { title: `${user.displayName} (@${user.handle}) の返信` }
    : { title: "ユーザーが見つかりません" };
}

export default async function TwitterProfileRepliesPage({ params }: Props) {
  const { handle } = await params;
  const user = getUserByHandle(handle);
  const profile = user ? getProfile(user.id) : undefined;
  if (!user || !profile) {
    notFound();
  }
  const users = usersById();
  const allPosts = listPostsByAuthor(user.id);
  const replies = allPosts.filter((post) => post.replyToId);

  return (
    <>
      <main className="tw-main">
        <ProfileShell user={user} profile={profile} postCount={allPosts.length} active="replies">
          <section aria-label="返信">
            {replies.length === 0 ? (
              <ProfileEmpty
                title="まだ返信はありません"
                description="返信すると、ここに表示されます。"
              />
            ) : null}
            {replies.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={user}
                replyTo={replyTargetAuthor(post, getPost, users)}
              />
            ))}
          </section>
        </ProfileShell>
      </main>
      <RightSidebar />
    </>
  );
}

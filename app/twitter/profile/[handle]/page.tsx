import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { replyTargetAuthor, usersById } from "@/components/twitter/lookup";
import { PostCard } from "@/components/twitter/post-card";
import { ProfileEmpty, ProfileShell } from "@/components/twitter/profile-shell";
import { RightSidebar } from "@/components/twitter/right-sidebar";
import { getPost, getProfile, getUserByHandle, listPostsByAuthor, listUsers } from "@/lib/mock";

type Props = { params: Promise<{ handle: string }> };

export const instant = false;

export function generateStaticParams() {
  return listUsers().map((user) => ({ handle: user.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = getUserByHandle(handle);
  return user
    ? { title: `${user.displayName} (@${user.handle})` }
    : { title: "ユーザーが見つかりません" };
}

export default async function TwitterProfilePage({ params }: Props) {
  const { handle } = await params;
  const user = getUserByHandle(handle);
  const profile = user ? getProfile(user.id) : undefined;
  if (!user || !profile) {
    notFound();
  }
  const users = usersById();
  const allPosts = listPostsByAuthor(user.id);
  const posts = allPosts.filter((post) => !post.replyToId);

  return (
    <>
      <main className="tw-main">
        <ProfileShell user={user} profile={profile} postCount={allPosts.length} active="posts">
          <section aria-label="ポスト">
            {posts.length === 0 ? (
              <ProfileEmpty
                title="まだポストはありません"
                description="ポストすると、ここに表示されます。"
              />
            ) : null}
            {posts.map((post) => (
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

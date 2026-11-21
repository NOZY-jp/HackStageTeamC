import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryTrigger } from "@/components/common/story/story-trigger";
import { replyTargetAuthor, usersById } from "@/components/twitter-like/lookup";
import { PostCard } from "@/components/twitter-like/post-card";
import { PostSeenTrigger } from "@/components/twitter-like/post-seen-trigger";
import { ProfileEmpty, ProfileShell } from "@/components/twitter-like/profile-shell";
import { RightSidebar } from "@/components/twitter-like/right-sidebar";
import {
  getPost,
  getProfile,
  getUserByHandle,
  listPostsByAuthor,
  listUsers,
} from "@/lib/twitter-like";
import { KANON_STALKER_POST_ID } from "@/lib/twitter-like/data/twitter";

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
    : { title: "このアカウントは存在しません" };
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
      {user.handle === "kanon__dayo" ? <StoryTrigger flag="foundBff" /> : null}
      <main className="tw-main">
        <ProfileShell user={user} profile={profile} postCount={allPosts.length} active="posts">
          <section aria-label="ポスト">
            {posts.length === 0 ? (
              <ProfileEmpty
                title="まだポストはありません"
                description="ポストすると、ここに表示されます。"
              />
            ) : null}
            {posts.map((post) => {
              const card = (
                <PostCard
                  key={post.id}
                  post={post}
                  author={user}
                  replyTo={replyTargetAuthor(post, getPost, users)}
                />
              );
              return post.id === KANON_STALKER_POST_ID ? (
                <PostSeenTrigger key={post.id} flag="te04-kanon-stalker-post">
                  {card}
                </PostSeenTrigger>
              ) : (
                card
              );
            })}
          </section>
        </ProfileShell>
      </main>
      <RightSidebar />
    </>
  );
}

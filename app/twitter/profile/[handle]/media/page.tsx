import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/twitter-like/post-card";
import { ProfileEmpty, ProfileShell } from "@/components/twitter-like/profile-shell";
import { RightSidebar } from "@/components/twitter-like/right-sidebar";
import { getProfile, getUserByHandle, listPostsByAuthor, listUsers } from "@/lib/twitter-like";

type Props = { params: Promise<{ handle: string }> };

export const instant = false;

export function generateStaticParams() {
  return listUsers().map((user) => ({ handle: user.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = getUserByHandle(handle);
  return user
    ? { title: `${user.displayName} (@${user.handle}) のメディア` }
    : { title: "このアカウントは存在しません" };
}

export default async function TwitterProfileMediaPage({ params }: Props) {
  const { handle } = await params;
  const user = getUserByHandle(handle);
  const profile = user ? getProfile(user.id) : undefined;
  if (!user || !profile) {
    notFound();
  }
  const posts = listPostsByAuthor(user.id);
  const postCount = posts.length;
  // 画像つきのポストだけをメディアタブに出す（鍵垢の投稿は公開面に出さない）
  const mediaPosts = posts.filter((post) => (post.media?.length ?? 0) > 0);

  return (
    <>
      <main className="tw-main">
        <ProfileShell user={user} profile={profile} postCount={postCount} active="media">
          {mediaPosts.length === 0 ? (
            <ProfileEmpty
              title="メディアはまだありません"
              description="画像や動画を含むポストをすると、ここに表示されます。"
            />
          ) : (
            mediaPosts.map((post) => <PostCard key={post.id} post={post} author={user} />)
          )}
        </ProfileShell>
      </main>
      <RightSidebar />
    </>
  );
}

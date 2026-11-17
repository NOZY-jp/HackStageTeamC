import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    : { title: "ユーザーが見つかりません" };
}

export default async function TwitterProfileMediaPage({ params }: Props) {
  const { handle } = await params;
  const user = getUserByHandle(handle);
  const profile = user ? getProfile(user.id) : undefined;
  if (!user || !profile) {
    notFound();
  }
  const postCount = listPostsByAuthor(user.id).length;

  return (
    <>
      <main className="tw-main">
        <ProfileShell user={user} profile={profile} postCount={postCount} active="media">
          <ProfileEmpty
            title="メディアはまだありません"
            description="画像や動画を含むポストをすると、ここに表示されます。"
          />
        </ProfileShell>
      </main>
      <RightSidebar />
    </>
  );
}

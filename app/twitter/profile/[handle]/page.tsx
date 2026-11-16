import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/twitter/avatar";
import { formatCount, formatJoinedAt } from "@/components/twitter/format";
import { replyTargetAuthor, usersById } from "@/components/twitter/lookup";
import { PageHeader } from "@/components/twitter/page-header";
import { PostCard } from "@/components/twitter/post-card";
import { getPost, getProfile, getUserByHandle, listPostsByAuthor, listUsers } from "@/lib/mock";

type Props = { params: Promise<{ handle: string }> };

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
  const posts = listPostsByAuthor(user.id);

  return (
    <>
      <PageHeader
        title={user.displayName}
        subtitle={`${posts.length} 件のポスト`}
        backHref="/twitter"
      />
      <section className="tw-profile" aria-label="プロフィール">
        <div
          className="tw-banner"
          style={{ backgroundColor: user.avatarColor }}
          aria-hidden="true"
        />
        <div className="tw-profile-body">
          <div className="tw-profile-avatar">
            <Avatar user={user} size="xl" />
          </div>
          <h2 className="tw-profile-name">{user.displayName}</h2>
          <p className="tw-handle">@{user.handle}</p>
          <p className="tw-profile-bio">{profile.bio}</p>
          <p className="tw-profile-meta">
            {profile.location ? <span>{profile.location}</span> : null}
            <span>{formatJoinedAt(profile.joinedAt)}から利用</span>
          </p>
          <p className="tw-profile-counts">
            <span>
              <strong>{formatCount(profile.followingCount)}</strong> フォロー中
            </span>
            <span>
              <strong>{formatCount(profile.followersCount)}</strong> フォロワー
            </span>
          </p>
        </div>
      </section>
      <section aria-label="ポスト">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            author={user}
            replyTo={replyTargetAuthor(post, getPost, users)}
          />
        ))}
      </section>
    </>
  );
}

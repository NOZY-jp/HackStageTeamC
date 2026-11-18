import Link from "next/link";
import type { ReactNode } from "react";
import type { Profile, TwitterUser } from "@/lib/twitter-like/types";
import { Avatar } from "./avatar";
import { formatCount, formatJoinedAt } from "./format";
import { CalendarIcon, VerifiedBadge } from "./icons";
import { LinkifiedText } from "./linkify";
import { isVerified } from "./lookup";
import { PageHeader } from "./page-header";

export type ProfileTab = "posts" | "replies" | "media" | "likes";

const tabs: { key: ProfileTab; label: string; suffix: string }[] = [
  { key: "posts", label: "ポスト", suffix: "" },
  { key: "replies", label: "返信", suffix: "/with_replies" },
  { key: "media", label: "メディア", suffix: "/media" },
  { key: "likes", label: "いいね", suffix: "/likes" },
];

/**
 * プロフィール画面の共通の骨格（見出し・バナー・情報・タブ行）。
 * タブは本家と同じくタブごとの URL（/{handle}、/with_replies、/media、/likes）。
 */
export function ProfileShell({
  user,
  profile,
  postCount,
  active,
  children,
}: {
  user: TwitterUser;
  profile: Profile;
  postCount: number;
  active: ProfileTab;
  children: ReactNode;
}) {
  const base = `/twitter/profile/${user.handle}`;
  return (
    <>
      <PageHeader
        title={user.displayName}
        titleBadge={isVerified(user) ? <VerifiedBadge /> : null}
        subtitle={`${postCount} 件のポスト`}
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
          <h2 className="tw-profile-name">
            {user.displayName}
            {isVerified(user) ? <VerifiedBadge /> : null}
          </h2>
          <p className="tw-handle">@{user.handle}</p>
          <p className="tw-profile-bio">
            <LinkifiedText text={profile.bio} />
          </p>
          <p className="tw-profile-meta">
            {profile.location ? <span>{profile.location}</span> : null}
            <span>
              <CalendarIcon />
              {formatJoinedAt(profile.joinedAt)}から利用
            </span>
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
        <nav className="tw-tabs tw-profile-tabs" aria-label="プロフィールのタブ">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`${base}${tab.suffix}`}
              className="tw-tab"
              data-active={tab.key === active || undefined}
              aria-current={tab.key === active ? "page" : undefined}
            >
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
      </section>
      {children}
    </>
  );
}

/** 中身が無いタブの空の状態。 */
export function ProfileEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="tw-empty">
      <p className="tw-empty-title">{title}</p>
      <p className="tw-empty-sub">{description}</p>
    </div>
  );
}

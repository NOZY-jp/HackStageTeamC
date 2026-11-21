"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { FbPost, FbUser } from "@/lib/facebook-like/types";
import { FbAvatar } from "./avatar";
import { useFacebook } from "./facebook-context";
import { BriefcaseIcon, ClockIcon, MapPinIcon } from "./icons";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";

type ProfileTab = "posts" | "about" | "friends" | "photos";

/** 「2018年4月」のような、talkup を始めた月 */
function joinedLabel(iso: string): string {
  const date = new Date(iso);
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月`;
}

type ProfileViewProps = {
  user: FbUser;
  friends: FbUser[];
};

export function ProfileView({ user, friends }: ProfileViewProps) {
  const { selfUser, posts } = useFacebook();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const isSelf = selfUser.id === user.id;
  const userPosts = useMemo(
    () => posts.filter((post) => post.authorId === user.id),
    [posts, user.id],
  );
  // 写真つきの投稿（写真の欄・写真のタブに並べる。画像が未用意のものは題名入りの仮の枠）
  const photoPosts = useMemo(
    () => userPosts.filter((post) => post.attachment?.kind === "photo"),
    [userPosts],
  );

  return (
    <div className="fb-profile-container">
      <section className="fb-card overflow-hidden">
        <div
          className="fb-cover-banner"
          style={{
            background: `linear-gradient(135deg, ${user.coverColor}, ${user.avatarColor})`,
          }}
        />

        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-8">
            <div className="shrink-0">
              <FbAvatar
                displayName={user.displayName}
                avatarColor={user.avatarColor}
                status={user.status}
                size="xl"
                showStatus
              />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{user.displayName}</h1>
                {user.bot ? <span className="fb-bot-badge">BOT</span> : null}
              </div>
              <p className="text-sm text-[var(--fb-muted)]">
                @{user.handle} · 友達 {friends.length}人
              </p>
            </div>
          </div>

          <div className="fb-profile-tabs" role="tablist" aria-label="プロフィール">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "posts"}
              onClick={() => setActiveTab("posts")}
              className={`fb-profile-tab ${activeTab === "posts" ? "is-active" : ""}`}
            >
              投稿 ({userPosts.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "about"}
              onClick={() => setActiveTab("about")}
              className={`fb-profile-tab ${activeTab === "about" ? "is-active" : ""}`}
            >
              基本データ
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "friends"}
              onClick={() => setActiveTab("friends")}
              className={`fb-profile-tab ${activeTab === "friends" ? "is-active" : ""}`}
            >
              友達 ({friends.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "photos"}
              onClick={() => setActiveTab("photos")}
              className={`fb-profile-tab ${activeTab === "photos" ? "is-active" : ""}`}
            >
              写真 ({photoPosts.length})
            </button>
          </div>
        </div>
      </section>

      {activeTab === "posts" ? (
        <div className="fb-profile-body">
          <aside className="space-y-4">
            <div className="fb-card p-4 space-y-3">
              <h2 className="font-bold text-base">自己紹介</h2>
              <p className="text-sm leading-relaxed">{user.bio}</p>
              {user.workplace ? (
                <div className="flex items-center gap-2 text-sm text-[var(--fb-muted)]">
                  <BriefcaseIcon className="w-4 h-4 shrink-0" />
                  <span>{user.workplace}</span>
                </div>
              ) : null}
              {user.location ? (
                <div className="flex items-center gap-2 text-sm text-[var(--fb-muted)]">
                  <MapPinIcon className="w-4 h-4 shrink-0" />
                  <span>{user.location}在住</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-sm text-[var(--fb-muted)]">
                <ClockIcon className="w-4 h-4 shrink-0" />
                <span>{joinedLabel(user.joinedAt)}から talkup を利用</span>
              </div>
            </div>

            {photoPosts.length > 0 ? (
              <div className="fb-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-base">写真</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("photos")}
                    className="fb-text-btn"
                  >
                    すべて見る
                  </button>
                </div>
                <PhotoGrid posts={photoPosts.slice(0, 9)} />
              </div>
            ) : null}

            <div className="fb-card p-4" id="friends">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-base">友達</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("friends")}
                  className="fb-text-btn"
                >
                  すべて見る
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {friends.slice(0, 6).map((friend) => (
                  <Link
                    key={friend.id}
                    href={`/talkup/profile/${friend.handle}`}
                    className="group block text-center"
                  >
                    <div
                      className="aspect-square rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: friend.avatarColor }}
                    >
                      {friend.displayName.slice(0, 2)}
                    </div>
                    <div className="text-xs font-medium mt-1 truncate group-hover:underline">
                      {friend.displayName}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            {isSelf ? <PostComposer /> : null}
            {userPosts.length > 0 ? (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="fb-card p-8 text-center text-sm text-[var(--fb-muted)]">
                まだ投稿はありません。
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "photos" ? (
        <section className="fb-card p-6">
          <h2 className="font-bold text-lg mb-4">写真（{photoPosts.length}枚）</h2>
          {photoPosts.length > 0 ? (
            <PhotoGrid posts={photoPosts} large />
          ) : (
            <p className="text-sm text-[var(--fb-muted)]">まだ写真はありません。</p>
          )}
        </section>
      ) : null}

      {activeTab === "about" ? (
        <section className="fb-card p-6 space-y-3">
          <h2 className="font-bold text-lg">基本データ</h2>
          <p className="text-sm leading-relaxed">{user.bio}</p>
          <dl className="grid sm:grid-cols-2 gap-3 pt-2 text-sm">
            <div className="p-3 rounded-lg bg-[var(--fb-bg)]">
              <dt className="text-xs text-[var(--fb-muted)]">所属</dt>
              <dd className="font-semibold mt-0.5">{user.workplace ?? "未設定"}</dd>
            </div>
            <div className="p-3 rounded-lg bg-[var(--fb-bg)]">
              <dt className="text-xs text-[var(--fb-muted)]">居住地</dt>
              <dd className="font-semibold mt-0.5">{user.location ?? "未設定"}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {activeTab === "friends" ? (
        <section className="fb-card p-6">
          <h2 className="font-bold text-lg mb-4">友達（{friends.length}人）</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/talkup/profile/${friend.handle}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-[var(--fb-border)] hover:bg-[var(--fb-hover)] transition-colors"
              >
                <FbAvatar
                  displayName={friend.displayName}
                  avatarColor={friend.avatarColor}
                  status={friend.status}
                  size="lg"
                  showStatus
                />
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{friend.displayName}</div>
                  <div className="text-xs text-[var(--fb-muted)] truncate">@{friend.handle}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** 写真つきの投稿を正方形で並べる。押すとその投稿を開く */
function PhotoGrid({ posts, large = false }: { posts: FbPost[]; large?: boolean }) {
  return (
    <ul className={`fb-photo-grid ${large ? "is-large" : ""}`}>
      {posts.map((post) => {
        const photo = post.attachment;
        if (!photo) return null;
        return (
          <li key={post.id}>
            <Link href={`/talkup/post/${post.id}`} className="fb-photo-tile" title={photo.title}>
              {photo.src ? (
                <Image
                  src={photo.src}
                  alt={photo.alt ?? photo.title}
                  width={photo.width ?? 800}
                  height={photo.height ?? 600}
                  unoptimized
                  className="fb-photo-tile-img"
                />
              ) : (
                <span className="fb-photo-tile-label">{photo.title}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

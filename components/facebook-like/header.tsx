"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { searchFacebook } from "@/lib/facebook-like";
import { FbAvatar } from "./avatar";
import { useFacebook } from "./facebook-context";
import { FbLogoIcon, HomeIcon, SearchIcon, UserCircleIcon } from "./icons";

export function FacebookHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { selfUser, searchQuery, setSearchQuery } = useFacebook();
  const [focused, setFocused] = useState(false);

  const quickUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    return searchFacebook(searchQuery).users.slice(0, 5);
  }, [searchQuery]);

  const isFeed = pathname === "/facebook";
  const isSelfProfile = pathname === `/facebook/profile/${selfUser.handle}`;

  return (
    <header className="fb-header">
      <div className="fb-header-left">
        <Link href="/facebook" className="fb-logo-link" aria-label="Facebook風ホーム">
          <FbLogoIcon className="w-10 h-10 text-[#1877f2]" />
        </Link>
        <div className="fb-search-box">
          <SearchIcon className="w-4 h-4 text-[var(--fb-muted)] shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="投稿やメンバーを検索"
            aria-label="投稿やメンバーを検索"
            className="fb-search-input"
          />
          {focused && quickUsers.length > 0 ? (
            <div className="fb-search-dropdown" role="listbox" aria-label="ユーザー検索結果">
              {quickUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="fb-search-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery("");
                    setFocused(false);
                    router.push(`/facebook/profile/${user.handle}`);
                  }}
                >
                  <FbAvatar
                    displayName={user.displayName}
                    avatarColor={user.avatarColor}
                    status={user.status}
                    size="sm"
                    showStatus
                  />
                  <div className="text-left min-w-0">
                    <div className="text-sm font-semibold truncate">{user.displayName}</div>
                    <div className="text-xs text-[var(--fb-muted)] truncate">@{user.handle}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <nav className="fb-header-nav" aria-label="メインナビゲーション">
        <Link
          href="/facebook"
          className={`fb-nav-tab ${isFeed ? "is-active" : ""}`}
          aria-current={isFeed ? "page" : undefined}
          title="ニュースフィード"
        >
          <HomeIcon className="w-6 h-6" />
          <span className="sr-only">ニュースフィード</span>
        </Link>
        <Link
          href={`/facebook/profile/${selfUser.handle}`}
          className={`fb-nav-tab ${isSelfProfile ? "is-active" : ""}`}
          aria-current={isSelfProfile ? "page" : undefined}
          title="プロフィール"
        >
          <UserCircleIcon className="w-6 h-6" />
          <span className="sr-only">プロフィール</span>
        </Link>
      </nav>

      <div className="fb-header-right">
        <Link href={`/facebook/profile/${selfUser.handle}`} className="fb-profile-chip">
          <FbAvatar
            displayName={selfUser.displayName}
            avatarColor={selfUser.avatarColor}
            status={selfUser.status}
            size="sm"
            showStatus
          />
          <span className="hidden sm:inline text-sm font-semibold">{selfUser.displayName}</span>
        </Link>
      </div>
    </header>
  );
}

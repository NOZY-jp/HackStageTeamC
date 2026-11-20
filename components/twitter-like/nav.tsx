"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getUserByHandle } from "@/lib/twitter-like";
import { Avatar } from "./avatar";
import {
  BrandIcon,
  ComposeIcon,
  HomeIcon,
  MailIcon,
  MoreIcon,
  SearchIcon,
  UserIcon,
} from "./icons";

type Item = { label: string; href: string; icon: ReactNode; match: (path: string) => boolean };

/** 左ナビは本家の構成に合わせて3項目だけ。プロフィールは「自分」として kohakunchos0117 を使う。 */
const ME_HANDLE = "kohakunchos0117";

const items: Item[] = [
  {
    label: "ホーム",
    href: "/twitter",
    icon: <HomeIcon />,
    match: (path) => path === "/twitter" || path.startsWith("/twitter/post/"),
  },
  {
    label: "検索",
    href: "/twitter/search",
    icon: <SearchIcon />,
    match: (path) => path.startsWith("/twitter/search"),
  },
  {
    label: "メッセージ",
    href: "/twitter/messages",
    icon: <MailIcon />,
    match: (path) => path.startsWith("/twitter/messages"),
  },
  {
    label: "プロフィール",
    href: `/twitter/profile/${ME_HANDLE}`,
    icon: <UserIcon />,
    match: (path) =>
      path === `/twitter/profile/${ME_HANDLE}` || path.startsWith(`/twitter/profile/${ME_HANDLE}/`),
  },
];

export function TwitterNav() {
  const pathname = usePathname();
  const me = getUserByHandle(ME_HANDLE);
  return (
    <header className="tw-left">
      <Link href="/twitter" className="tw-logo" aria-label="Twixer ホームへ">
        <BrandIcon />
        <span className="tw-logo-text">Twixer</span>
      </Link>
      <nav className="tw-nav" aria-label="メインナビゲーション">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="tw-nav-item"
            aria-current={item.match(pathname) ? "page" : undefined}
          >
            {item.icon}
            <span className="tw-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <button type="button" className="tw-post-button" disabled title="このデモでは投稿できません">
        <span className="tw-post-button-label">ポストする</span>
        <span className="tw-post-button-icon" aria-hidden="true">
          <ComposeIcon />
        </span>
      </button>
      {me ? (
        <Link href={`/twitter/profile/${ME_HANDLE}`} className="tw-account">
          <Avatar user={me} />
          <span className="tw-account-text">
            <span className="tw-account-name">{me.displayName}</span>
            <span className="tw-account-handle">@{me.handle}</span>
          </span>
          <MoreIcon />
        </Link>
      ) : null}
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BellIcon, HomeIcon, MailIcon, SearchIcon, UserIcon } from "./icons";

type Item = { label: string; href?: string; icon: ReactNode; match: (path: string) => boolean };

/** プロフィールは「自分」として hal を使う。未実装の項目は href を持たず disabled 表示。 */
const ME_HANDLE = "hal";

const items: Item[] = [
  {
    label: "ホーム",
    href: "/twitter",
    icon: <HomeIcon />,
    match: (path) => path === "/twitter" || path.startsWith("/twitter/post/"),
  },
  { label: "話題を検索", icon: <SearchIcon />, match: () => false },
  { label: "通知", icon: <BellIcon />, match: () => false },
  { label: "メッセージ", icon: <MailIcon />, match: () => false },
  {
    label: "プロフィール",
    href: `/twitter/profile/${ME_HANDLE}`,
    icon: <UserIcon />,
    match: (path) => path.startsWith("/twitter/profile/"),
  },
];

export function TwitterNav() {
  const pathname = usePathname();
  return (
    <nav className="tw-nav" aria-label="メインナビゲーション">
      {items.map((item) => {
        const content = (
          <>
            {item.icon}
            <span className="tw-nav-label">{item.label}</span>
          </>
        );
        if (!item.href) {
          return (
            <span key={item.label} className="tw-nav-item" aria-disabled="true">
              {content}
            </span>
          );
        }
        return (
          <Link
            key={item.label}
            href={item.href}
            className="tw-nav-item"
            aria-current={item.match(pathname) ? "page" : undefined}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

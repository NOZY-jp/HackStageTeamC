"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type KeyboardEvent, useEffect, useRef } from "react";
import { useShellControls } from "./app-shell";

export type RailGuild = {
  id: string;
  name: string;
  iconColor: string;
  initials: string;
  href: string;
  unreadCount: number;
  mentionCount: number;
};

const ITEM_SELECTOR = "[data-rail-item]";

/**
 * 左端のレール。上から DM ホーム → 区切り線 → サーバー（listGuilds の順）。
 * 選択状態は URL から決め、Tab / ↑↓ / Enter / Space で操作できる。
 */
export function ServerRailNav({ guilds }: { guilds: RailGuild[] }) {
  const pathname = usePathname();
  const { closeOverlays } = useShellControls();
  const navRef = useRef<HTMLElement>(null);
  const dmActive = pathname === "/dm" || pathname.startsWith("/dm/");

  // 画面遷移したときだけ、開いたままのオーバーレイを閉じる（初回マウントでは閉じない）
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }
    previousPathname.current = pathname;
    closeOverlays();
  }, [pathname, closeOverlays]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const nav = navRef.current;
    if (!nav) {
      return;
    }
    const items = Array.from(nav.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
    if (items.length === 0) {
      return;
    }
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        currentIndex === -1
          ? step > 0
            ? 0
            : items.length - 1
          : (currentIndex + step + items.length) % items.length;
      items[nextIndex]?.focus();
      return;
    }

    // リンクは Enter で遷移するが Space では遷移しないため、Space も同じ動きにする
    if (event.key === " " && currentIndex !== -1) {
      event.preventDefault();
      items[currentIndex].click();
    }
  };

  return (
    <nav
      ref={navRef}
      aria-label="サーバー一覧"
      id="app-rail"
      className="app-rail"
      onKeyDown={handleKeyDown}
    >
      <Link
        href="/dm"
        className="rail-button rail-button-dm"
        aria-label="ダイレクトメッセージ"
        aria-current={dmActive ? "page" : undefined}
        title="ダイレクトメッセージ"
        data-rail-item
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.8 8.8 0 0 1-3.8-.85L3 21l1.85-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" />
        </svg>
      </Link>

      <div className="rail-divider" aria-hidden="true" />

      {guilds.map((guild) => {
        const active =
          pathname === `/servers/${guild.id}` || pathname.startsWith(`/servers/${guild.id}/`);
        const unread = guild.unreadCount > 0;
        const mention = guild.mentionCount > 0;
        const label = [
          guild.name,
          unread ? "未読あり" : "",
          mention ? `メンション${guild.mentionCount}件` : "",
        ]
          .filter(Boolean)
          .join("、");

        return (
          <Link
            key={guild.id}
            href={guild.href}
            className="rail-button rail-button-guild"
            style={{ backgroundColor: guild.iconColor }}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            title={guild.name}
            data-rail-item
            data-unread={unread ? "true" : undefined}
          >
            <span aria-hidden="true" className="rail-initials">
              {guild.initials}
            </span>
            {mention ? (
              <span aria-hidden="true" className="rail-mention">
                {guild.mentionCount > 99 ? "99+" : guild.mentionCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

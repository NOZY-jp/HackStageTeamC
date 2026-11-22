"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CONTEST_NAV,
  CONTEST_ORGANIZER,
  CONTEST_SITE_NAME,
  CONTEST_SITE_PATH,
} from "@/lib/contest-like/site";

/**
 * 主催者サイトの枠（ロゴ・サイト内ナビ・フッター・#265）。
 * でんでんのブログとは別の、公式サイトとして見せる（作中の URL は soukyuu-photo.jp）。
 */
export function ContestFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = (pathname ?? "").replace(/\/+$/, "") || "/";

  return (
    <div className="contest-site">
      <header className="contest-site-header">
        <div className="contest-site-inner">
          <Link href={CONTEST_SITE_PATH} className="contest-site-logo">
            <span className="contest-site-mark" aria-hidden="true" />
            <span className="contest-site-name">
              {CONTEST_SITE_NAME}
              <span className="contest-site-name-en">SOUKYU PHOTO AWARD</span>
            </span>
          </Link>
          <div className="contest-site-side">
            <p className="contest-site-organizer">主催　{CONTEST_ORGANIZER}</p>
            <nav className="contest-site-nav" aria-label="サイト内">
              {CONTEST_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="contest-site-nav-item"
                  aria-current={current === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="contest-site-main">{children}</main>
      <footer className="contest-site-footer">© {CONTEST_ORGANIZER}</footer>
    </div>
  );
}

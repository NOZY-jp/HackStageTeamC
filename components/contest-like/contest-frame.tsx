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

/** 主催者サイトの枠（ロゴ・ナビ・フッター）。でんでんのブログとは別の、すっきりした公式サイトの見た目 */
export function ContestFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = (pathname ?? "").replace(/\/+$/, "") || "/";

  return (
    <div className="sk-site">
      <header className="sk-header">
        <div className="sk-header-inner">
          <Link href={CONTEST_SITE_PATH} className="sk-logo">
            <span className="sk-logo-mark" aria-hidden="true" />
            <span className="sk-logo-text">
              {CONTEST_SITE_NAME}
              <span className="sk-logo-en">SOUKYU PHOTO AWARD</span>
            </span>
          </Link>
          <nav className="sk-nav" aria-label="サイト内">
            {CONTEST_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="sk-nav-item"
                aria-current={current === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="sk-main">{children}</main>
      <footer className="sk-footer">© {CONTEST_ORGANIZER}</footer>
    </div>
  );
}

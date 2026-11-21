import Link from "next/link";
import type { ReactNode } from "react";
import { SearchIcon } from "./icons";
import { PageHeader } from "./page-header";
import { RightSidebar } from "./right-sidebar";

/**
 * /twitter 配下の 404 系画面の共通の骨格（見出し・検索窓・案内文・戻る導線・サイドバー）。
 * children はタイトルの直下に差し込む（@handle 表示など）。
 */
export function TwitterNotFoundView({
  headerTitle,
  title,
  description,
  children,
}: {
  headerTitle: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <main className="tw-main">
        <PageHeader title={headerTitle} backHref="/twitter" />
        <form className="tw-search" action="/twitter/search">
          <SearchIcon />
          <input
            type="search"
            name="q"
            className="tw-search-input"
            placeholder="キーワードを検索"
            aria-label="検索キーワード"
          />
        </form>
        <div className="tw-empty">
          <p className="tw-empty-title">{title}</p>
          {children}
          {description ? <p className="tw-empty-sub">{description}</p> : null}
          <p>
            <Link href="/twitter" className="tw-inline-link">
              タイムラインへ戻る
            </Link>
          </p>
        </div>
      </main>
      <RightSidebar />
    </>
  );
}

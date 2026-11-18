import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SearchIcon } from "@/components/note-like/icons";
import { SERVICE_NAME } from "@/lib/note-like";

export const metadata: Metadata = {
  title: {
    default: SERVICE_NAME,
    template: `%s｜${SERVICE_NAME}`,
  },
  description: "一枚ずつ、長い話を残しておける場所。",
};

export default function NoteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="note-shell">
      <header className="note-header">
        <div className="note-header-inner">
          <Link href="/note" className="note-brand">
            {SERVICE_NAME}
          </Link>
          <search className="note-search">
            <form action="/note/search" className="note-search-form">
              <SearchIcon size="sm" />
              <input
                type="search"
                name="q"
                aria-label="記事を検索"
                placeholder="キーワードやクリエイターで検索"
                className="note-search-input"
              />
            </form>
          </search>
        </div>
      </header>
      <main>{children}</main>
      <footer className="note-footer">© {SERVICE_NAME}</footer>
    </div>
  );
}

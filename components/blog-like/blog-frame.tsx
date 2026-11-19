import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BLOG_SERVICE_NAME,
  type Blog,
  blogPath,
  entryPath,
  listCategories,
  listMonths,
  listPublicEntries,
} from "@/lib/blog-like";

/** 2018年ごろの無料ブログのテンプレート（サービスのバー・ヘッダー画像・右サイドバー）。 */
export function BlogFrame({ blog, children }: { blog: Blog; children: ReactNode }) {
  const recent = listPublicEntries(blog.id).slice(0, 5);
  return (
    <div className="pb-shell">
      <div className="pb-service-bar">
        <span className="pb-service-logo">{BLOG_SERVICE_NAME}</span>
        <span>無料ブログはぽちブロ</span>
      </div>
      <div className="pb-container">
        <header className="pb-blog-header">
          <Link href={blogPath(blog.id)} className="pb-blog-title">
            {blog.title}
          </Link>
          <p className="pb-blog-description">{blog.description}</p>
        </header>
        <div className="pb-layout">
          <main className="pb-main">{children}</main>
          <aside className="pb-sidebar">
            <SideBox title="プロフィール">
              <div className="pb-profile">
                <Image
                  src={blog.avatar}
                  alt=""
                  width={256}
                  height={256}
                  unoptimized
                  className="pb-avatar"
                />
                <p className="pb-profile-name">{blog.authorName}</p>
              </div>
              <p className="pb-profile-text">{blog.authorProfile}</p>
            </SideBox>
            <SideBox title="最新記事">
              <ul className="pb-side-list">
                {recent.map((entry) => (
                  <li key={entry.id}>
                    <Link href={entryPath(blog.id, entry.id)}>{entry.title}</Link>
                  </li>
                ))}
              </ul>
            </SideBox>
            <SideBox title="カテゴリ">
              <ul className="pb-side-list">
                {listCategories(blog.id).map(({ name, count }) => (
                  <li key={name}>
                    {name} ({count})
                  </li>
                ))}
              </ul>
            </SideBox>
            <SideBox title="月別アーカイブ">
              <ul className="pb-side-list">
                {listMonths(blog.id).map(({ month, count }) => (
                  <li key={month}>
                    {month.slice(0, 4)}年{month.slice(5)}月 ({count})
                  </li>
                ))}
              </ul>
            </SideBox>
            <SideBox title="カウンター">
              <p className="visually-hidden">訪問者数 {blog.visitorCount}人</p>
              <p className="pb-counter" aria-hidden="true">
                {String(blog.visitorCount)
                  .padStart(6, "0")
                  .split("")
                  .map((digit, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: 桁の位置そのものがキー
                    <span key={index}>{digit}</span>
                  ))}
              </p>
              <p className="pb-kiriban">キリ番踏み逃げ禁止！</p>
              <p className="pb-kiriban-note">20000を踏んだ人はコメントで教えてね</p>
            </SideBox>
          </aside>
        </div>
        <footer className="pb-footer">
          Copyright © {blog.title} All Rights Reserved. / Powered by {BLOG_SERVICE_NAME}
        </footer>
      </div>
    </div>
  );
}

function SideBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pb-side-box">
      <h2 className="pb-side-title">{title}</h2>
      <div className="pb-side-content">{children}</div>
    </section>
  );
}

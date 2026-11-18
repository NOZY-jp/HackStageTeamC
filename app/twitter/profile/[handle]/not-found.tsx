import Link from "next/link";
import { PageHeader } from "@/components/twitter-like/page-header";
import { RightSidebar } from "@/components/twitter-like/right-sidebar";

/** 存在しない handle のプロフィール。本家の「このアカウントは存在しません」に合わせる。 */
export default function TwitterProfileNotFound() {
  return (
    <>
      <main className="tw-main">
        <PageHeader title="プロフィール" backHref="/twitter" />
        <div className="tw-empty">
          <p className="tw-empty-title">このアカウントは存在しません</p>
          <p className="tw-empty-sub">他のキーワードを検索してみてください。</p>
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

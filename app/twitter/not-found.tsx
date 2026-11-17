import Link from "next/link";
import { PageHeader } from "@/components/twitter/page-header";
import { RightSidebar } from "@/components/twitter/right-sidebar";

export default function TwitterNotFound() {
  return (
    <>
      <main className="tw-main">
        <PageHeader title="見つかりません" backHref="/twitter" />
        <div className="tw-empty">
          <p>お探しの投稿またはユーザーは存在しません。</p>
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

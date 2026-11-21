import { Suspense } from "react";
import { ProfileContent } from "./profile-content";

// Cache Components（PPR）では、ページのトップレベルで await params すると
// 静的シェルがブロックされ「params が <Suspense> の外で読まれている」エラーになる。
// ドキュメント推奨の形に従い、ページ自体は同期コンポーネントにして、
// params を読む async 部分を <Suspense> で包む。
// 参考: node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md
//       「Await `params` inside `<Suspense>`」の節
export default function FacebookProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ProfileContent params={params} />
    </Suspense>
  );
}

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostDetailView } from "@/components/facebook-like/post-detail-view";

// Cache Components（PPR）では、ページのトップレベルで await params すると
// 静的シェルがブロックされ「params が <Suspense> の外で読まれている」エラーになる。
// ドキュメント推奨の形に従い、ページ自体は同期コンポーネントにして、
// params を読む async 部分を <Suspense> で包む。
// 参考: node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md
//       「Await `params` inside `<Suspense>`」の節
export default function FacebookPostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <PostDetailContent params={params} />
    </Suspense>
  );
}

async function PostDetailContent({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;

  let decodedPostId: string;
  try {
    decodedPostId = decodeURIComponent(postId);
  } catch {
    // 不正な URL セグメント（例: /talkup/post/100%）は 404 として扱う
    notFound();
  }

  return <PostDetailView postId={decodedPostId} />;
}

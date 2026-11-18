import { notFound } from "next/navigation";
import { PostDetailView } from "@/components/facebook-like/post-detail-view";

export default async function FacebookPostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;

  let decodedPostId: string;
  try {
    decodedPostId = decodeURIComponent(postId);
  } catch {
    // 不正な URL セグメント（例: /facebook/post/100%）は 404 として扱う
    notFound();
  }

  return <PostDetailView postId={decodedPostId} />;
}

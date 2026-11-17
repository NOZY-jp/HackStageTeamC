import { PostDetailView } from "@/components/facebook-like/post-detail-view";

export default async function FacebookPostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return <PostDetailView postId={decodeURIComponent(postId)} />;
}

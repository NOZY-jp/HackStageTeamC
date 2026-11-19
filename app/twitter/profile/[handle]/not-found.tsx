import { NotFoundHandle } from "@/components/twitter-like/not-found-handle";
import { TwitterNotFoundView } from "@/components/twitter-like/not-found-view";

/** 存在しない handle のプロフィール。本家の「このアカウントは存在しません」に合わせる。 */
export default function TwitterProfileNotFound() {
  return (
    <TwitterNotFoundView
      headerTitle="プロフィール"
      title="このアカウントは存在しません"
      description="アカウントが削除されたか、URLが間違っている可能性があります。"
    >
      <NotFoundHandle />
    </TwitterNotFoundView>
  );
}

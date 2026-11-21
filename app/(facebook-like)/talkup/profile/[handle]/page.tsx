import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StoryTrigger } from "@/components/common/story/story-trigger";
import { ProfileView } from "@/components/facebook-like/profile-view";
import { getUserByHandle, listFollowers, listFollowing, listFriends } from "@/lib/facebook-like";
import { KAI_TALKUP_USER_ID } from "@/lib/facebook-like/data/users";

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

async function ProfileContent({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

  let decodedHandle: string;
  try {
    decodedHandle = decodeURIComponent(handle);
  } catch {
    // 不正な URL セグメント（例: /talkup/profile/100%）は 404 として扱う
    notFound();
  }

  const user = getUserByHandle(decodedHandle);

  if (!user) {
    notFound();
  }

  const friends = listFriends(user.id);
  const following = listFollowing(user.id);
  const followers = listFollowers(user.id);
  return (
    <>
      {user.id === "u40" ? <StoryTrigger flag="s10-talkup-match" delayMs={2500} /> : null}
      {user.id === KAI_TALKUP_USER_ID ? <StoryTrigger flag="te03-talkup-kai-follower" /> : null}
      <ProfileView user={user} friends={friends} following={following} followers={followers} />
    </>
  );
}

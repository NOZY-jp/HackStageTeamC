import { notFound } from "next/navigation";
import { StoryTrigger } from "@/components/common/story/story-trigger";
import { ProfileView } from "@/components/facebook-like/profile-view";
import { TalkupMatchTrigger } from "@/components/facebook-like/talkup-match-trigger";
import { getUserByHandle, listFollowers, listFollowing, listFriends } from "@/lib/facebook-like";
import { KAI_TALKUP_USER_ID } from "@/lib/facebook-like/data/users";

export async function ProfileContent({ params }: { params: Promise<{ handle: string }> }) {
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
      {/* 段階10はカイの連絡（順序9）まで進んだときだけ（#275） */}
      {user.id === "u40" ? <TalkupMatchTrigger delayMs={2500} /> : null}
      {user.id === KAI_TALKUP_USER_ID ? <StoryTrigger flag="te03-talkup-kai-follower" /> : null}
      <ProfileView user={user} friends={friends} following={following} followers={followers} />
    </>
  );
}

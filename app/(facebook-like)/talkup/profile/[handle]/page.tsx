import { notFound } from "next/navigation";
import { ProfileView } from "@/components/facebook-like/profile-view";
import { getUserByHandle, listFriends } from "@/lib/facebook-like";

export default async function FacebookProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
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
  return <ProfileView user={user} friends={friends} />;
}

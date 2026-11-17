import { notFound } from "next/navigation";
import { ProfileView } from "@/components/facebook-like/profile-view";
import { getUserByHandle, listFriends } from "@/lib/facebook-like";

export default async function FacebookProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const user = getUserByHandle(decodeURIComponent(handle));

  if (!user) {
    notFound();
  }

  const friends = listFriends(user.id);
  return <ProfileView user={user} friends={friends} />;
}

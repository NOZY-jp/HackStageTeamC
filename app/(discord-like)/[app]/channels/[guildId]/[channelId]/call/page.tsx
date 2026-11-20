import type { Metadata } from "next";
import { DmCallView } from "@/app/(discord-like)/_components/dm-call-view";
import { DmNotFound } from "@/app/(discord-like)/_components/dm-not-found";
import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import { getDMThread, getUser } from "@/lib/discord-like";
import { resolveDmCallRoute } from "@/lib/discord-like/route-resolution";

export const metadata: Metadata = {
  title: "通話",
  // 通話画面は検索に載せない
  robots: { index: false, follow: false },
};

/** DM の通話画面（`/channels/@me/<dm>/call`）。DM 以外の URL では DM の未検出UIを出す。 */
export default async function DmCallPage({
  params,
}: {
  params: Promise<{ guildId: string; channelId: string }>;
}) {
  const { guildId, channelId } = await params;
  const route = resolveDmCallRoute(guildId, channelId);
  if (route.kind !== "dm-call") {
    return <DmNotFound />;
  }
  const thread = getDMThread(route.threadId);
  if (!thread) {
    return <DmNotFound />;
  }
  const otherId =
    thread.participantIds.find((id) => id !== SELF_USER_ID) ?? thread.participantIds[0];
  const other = getUser(otherId);
  const self = getUser(SELF_USER_ID);
  const otherName = other?.displayName ?? otherId;

  return (
    <DmCallView
      threadId={thread.id}
      threadUrlId={thread.urlId}
      self={{
        displayName: self?.displayName ?? "自分",
        avatarColor: self?.avatarColor ?? "transparent",
      }}
      other={{ displayName: otherName, avatarColor: other?.avatarColor ?? "transparent" }}
    />
  );
}

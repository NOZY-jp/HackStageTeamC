import { notFound } from "next/navigation";
import { DmList } from "@/app/(discord-like)/_components/dm-list";
import { DmNotFound } from "@/app/(discord-like)/_components/dm-not-found";
import { MessagePane } from "@/app/(discord-like)/_components/message-pane";
import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import { VoiceChannelView } from "@/app/(discord-like)/_components/voice-channel-view";
import { ChannelSidebar } from "@/components/discord-like/channel-sidebar";
import {
  getChannel,
  getDMThread,
  getGuild,
  getUser,
  listDMMessages,
  listMessages,
  listVoiceStates,
} from "@/lib/discord-like";
import { resolveChannelRoute } from "@/lib/discord-like/route-resolution";

/**
 * Discord と同じ2セグメント構成。
 * - `/<app>/channels/@me/<dmChannelId>` → DMスレッド
 * - `/<app>/channels/<guildId>/<channelId>` → サーバーのチャンネル
 */
export default async function ChannelPage({
  params,
}: {
  params: Promise<{ guildId: string; channelId: string }>;
}) {
  const { guildId, channelId } = await params;
  const route = resolveChannelRoute(guildId, channelId);

  switch (route.kind) {
    case "dm":
      return <DmThread threadId={route.threadId} />;
    case "dm-missing":
      // DM は旧画面と同じ専用の未検出UI（not-found.tsx は動的パラメータを受け取れない）
      return <DmNotFound />;
    case "channel":
      return <GuildChannel guildId={route.guildId} channelId={route.channelId} />;
    default:
      notFound();
  }
}

async function DmThread({ threadId }: { threadId: string }) {
  const thread = getDMThread(threadId);
  if (!thread) {
    return <DmNotFound />;
  }

  const otherId =
    thread.participantIds.find((participantId) => participantId !== SELF_USER_ID) ??
    thread.participantIds[0];
  const other = getUser(otherId);
  const otherName = other?.displayName ?? otherId;

  return (
    <>
      <DmList activeThreadId={thread.id} />
      <MessagePane
        channelKey={thread.id}
        mode="dm"
        initialPage={listDMMessages({ threadId: thread.id })}
        title={otherName}
        showHash={false}
        headerAvatar={{ displayName: otherName, avatarColor: other?.avatarColor ?? "transparent" }}
      />
    </>
  );
}

async function GuildChannel({ guildId, channelId }: { guildId: string; channelId: string }) {
  const guild = getGuild(guildId);
  const channel = getChannel(channelId);

  if (!guild || !channel) {
    notFound();
  }

  const selfUser = getUser(SELF_USER_ID);
  const currentUser = {
    id: SELF_USER_ID,
    displayName: selfUser?.displayName ?? "自分",
    avatarColor: selfUser?.avatarColor ?? "transparent",
  };

  return (
    <>
      <ChannelSidebar guildId={guild.id} channelId={channel.id} />

      {channel.kind === "text" ? (
        <MessagePane
          channelKey={channel.id}
          mode="channel"
          initialPage={listMessages({ channelId: channel.id })}
          title={channel.name}
          topic={channel.topic}
          showHash
        />
      ) : (
        <VoiceChannelView
          guildId={channel.guildId}
          guildUrlId={guild.urlId}
          channelId={channel.id}
          channelUrlId={channel.urlId}
          channelName={channel.name}
          currentUser={currentUser}
          participants={listVoiceStates(channel.id).map((state) => {
            const user = getUser(state.userId);
            return {
              id: state.userId,
              displayName: user?.displayName ?? state.userId,
              avatarColor: user?.avatarColor ?? "transparent",
              speaking: state.speaking,
              muted: state.muted,
              deafened: state.deafened,
            };
          })}
        />
      )}
    </>
  );
}

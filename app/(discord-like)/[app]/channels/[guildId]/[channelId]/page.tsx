import { notFound } from "next/navigation";
import { DmNotFound } from "@/app/(discord-like)/_components/dm-not-found";
import { MessagePane } from "@/app/(discord-like)/_components/message-pane";
import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import { VoiceChannelView } from "@/app/(discord-like)/_components/voice-channel-view";
import {
  getChannel,
  getDMThread,
  getGuild,
  getUser,
  listDMMessages,
  listMessages,
  listVoiceStates,
  loadUntil,
} from "@/lib/discord-like";
import { resolveChannelRoute } from "@/lib/discord-like/route-resolution";
import { listMemberViews, toMessageView } from "@/lib/discord-like/view";

/**
 * Discord と同じ2セグメント構成。
 * - `/<app>/channels/@me/<dmChannelId>` → DMスレッド
 * - `/<app>/channels/<guildId>/<channelId>` → サーバーのチャンネル
 */
export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string; channelId: string }>;
  searchParams: Promise<{ m?: string | string[] }>;
}) {
  const [{ guildId, channelId }, query] = await Promise.all([params, searchParams]);
  const focus = typeof query.m === "string" ? query.m : undefined;
  const route = resolveChannelRoute(guildId, channelId);

  switch (route.kind) {
    case "dm":
      return <DmThread threadId={route.threadId} focusMessageId={focus} />;
    case "dm-missing":
      // DM は旧画面と同じ専用の未検出UI（not-found.tsx は動的パラメータを受け取れない）
      return <DmNotFound />;
    case "channel":
      return (
        <GuildChannel guildId={route.guildId} channelId={route.channelId} focusMessageId={focus} />
      );
    default:
      notFound();
  }
}

async function DmThread({
  threadId,
  focusMessageId,
}: {
  threadId: string;
  focusMessageId?: string;
}) {
  const thread = getDMThread(threadId);
  if (!thread) {
    return <DmNotFound />;
  }

  const otherId =
    thread.participantIds.find((participantId) => participantId !== SELF_USER_ID) ??
    thread.participantIds[0];
  const other = getUser(otherId);
  const otherName = other?.displayName ?? otherId;

  // 検索からジャンプしてきたときは、そのメッセージを含むところまで遡って表示する
  const focused = focusMessageId
    ? loadUntil({ threadId: thread.id, messageId: focusMessageId })
    : undefined;
  const page = focused?.found ? focused : listDMMessages({ threadId: thread.id });

  return (
    <MessagePane
      channelKey={thread.id}
      mode="dm"
      initialView={toMessageView(page)}
      title={otherName}
      showHash={false}
      headerAvatar={{ displayName: otherName, avatarColor: other?.avatarColor ?? "transparent" }}
      focusMessageId={focused?.found ? focusMessageId : undefined}
    />
  );
}

async function GuildChannel({
  guildId,
  channelId,
  focusMessageId,
}: {
  guildId: string;
  channelId: string;
  focusMessageId?: string;
}) {
  const guild = getGuild(guildId);
  const channel = getChannel(channelId);

  if (!guild || !channel) {
    notFound();
  }

  const members = listMemberViews();
  // 検索からジャンプしてきたときは、そのメッセージを含むところまで遡って表示する
  const focused = focusMessageId
    ? loadUntil({ channelId: channel.id, messageId: focusMessageId })
    : undefined;
  const page = focused?.found ? focused : listMessages({ channelId: channel.id });
  const selfUser = getUser(SELF_USER_ID);
  const currentUser = {
    id: SELF_USER_ID,
    displayName: selfUser?.displayName ?? "自分",
    avatarColor: selfUser?.avatarColor ?? "transparent",
  };

  return (
    <>
      {channel.kind === "text" ? (
        <MessagePane
          channelKey={channel.id}
          mode="channel"
          initialView={toMessageView(page)}
          title={channel.name}
          topic={channel.topic}
          showHash
          members={members}
          focusMessageId={focused?.found ? focusMessageId : undefined}
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

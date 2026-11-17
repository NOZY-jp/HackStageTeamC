import { notFound } from "next/navigation";
import { DmList } from "@/app/(discord-like)/_components/dm-list";
import { MessagePane } from "@/app/(discord-like)/_components/message-pane";
import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import { VoiceChannelView } from "@/app/(discord-like)/_components/voice-channel-view";
import { ChannelSidebar } from "@/components/discord-like/channel-sidebar";
import {
  getChannelByUrlId,
  getDMThreadByUrlId,
  getGuildByUrlId,
  getUser,
  listDMMessages,
  listMessages,
  listVoiceStates,
} from "@/lib/discord-like";

const DM_HOME = "@me";

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

  // 動的セグメントは URL エンコードされたまま渡ることがある（"@me" → "%40me"）
  const decodedGuildId = decodeURIComponent(guildId);
  if (decodedGuildId === DM_HOME) {
    return <DmThread urlId={channelId} />;
  }
  return <GuildChannel guildUrlId={decodedGuildId} channelUrlId={channelId} />;
}

async function DmThread({ urlId }: { urlId: string }) {
  const thread = getDMThreadByUrlId(urlId);
  if (!thread) {
    notFound();
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
        initialMessages={listDMMessages(thread.id)}
        title={otherName}
        showHash={false}
        headerAvatar={{ displayName: otherName, avatarColor: other?.avatarColor ?? "transparent" }}
      />
    </>
  );
}

async function GuildChannel({
  guildUrlId,
  channelUrlId,
}: {
  guildUrlId: string;
  channelUrlId: string;
}) {
  const guild = getGuildByUrlId(guildUrlId);
  const channel = getChannelByUrlId(channelUrlId);

  // チャンネルが別のサーバーのものだった場合も未検出にする
  if (!guild || !channel || channel.guildId !== guild.id) {
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
          initialMessages={listMessages(channel.id)}
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

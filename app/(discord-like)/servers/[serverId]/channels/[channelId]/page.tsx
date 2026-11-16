import { notFound } from "next/navigation";
import { MessagePane } from "@/app/(discord-like)/_components/message-pane";
import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import { VoiceChannelView } from "@/app/(discord-like)/_components/voice-channel-view";
import { ChannelSidebar } from "@/components/discord-like/channel-sidebar";
import { getChannel, getUser, listMessages, listVoiceStates } from "@/lib/discord-like";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ serverId: string; channelId: string }>;
}) {
  const { serverId, channelId } = await params;
  const channel = getChannel(channelId);

  if (!channel) {
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
      <ChannelSidebar guildId={serverId} channelId={channelId} />

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
          channelId={channel.id}
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

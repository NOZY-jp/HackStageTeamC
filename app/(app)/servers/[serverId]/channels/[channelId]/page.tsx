import { ChannelSidebar } from "@/components/channel-sidebar";
import { MainPane } from "@/components/main-pane";
import { getChannel, getUser, listMessages, listVoiceStates } from "@/lib/mock";
import { MessagePane } from "../../../../_components/message-pane";
import { SELF_USER_ID } from "../../../../_components/self-user";
import { VoiceChannelView } from "../../../../_components/voice-channel-view";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ serverId: string; channelId: string }>;
}) {
  const { serverId, channelId } = await params;
  const channel = getChannel(channelId);
  const selfUser = getUser(SELF_USER_ID);
  const currentUser = {
    id: SELF_USER_ID,
    displayName: selfUser?.displayName ?? "自分",
    avatarColor: selfUser?.avatarColor ?? "transparent",
  };

  return (
    <>
      <ChannelSidebar guildId={serverId} channelId={channelId} />

      {channel?.kind === "text" ? (
        <MessagePane
          channelKey={channel.id}
          initialMessages={listMessages(channel.id)}
          title={channel.name}
          topic={channel.topic}
          showHash
        />
      ) : channel?.kind === "voice" ? (
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
      ) : (
        <MainPane label="チャンネル" heading={channel ? channel.name : channelId}>
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-base font-semibold text-fg">
              {channel ? `#${channel.name}` : "チャンネルが見つかりません"}
            </p>
            <p className="text-sm leading-6 text-fg-muted">
              URL のチャンネルIDを確認してください。
            </p>
          </div>
        </MainPane>
      )}
    </>
  );
}

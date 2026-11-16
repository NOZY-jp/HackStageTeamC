import { ChannelSidebar } from "@/components/channel-sidebar";
import { MainPane } from "@/components/main-pane";
import { getChannel, listMessages } from "@/lib/mock";
import { MessageList } from "../../../../_components/message-list";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ serverId: string; channelId: string }>;
}) {
  const { serverId, channelId } = await params;
  const channel = getChannel(channelId);

  return (
    <>
      <ChannelSidebar guildId={serverId} channelId={channelId} />

      {channel?.kind === "text" ? (
        <MessageList
          messages={listMessages(channel.id)}
          title={channel.name}
          topic={channel.topic}
          showHash
        />
      ) : (
        <MainPane label="チャンネル" heading={channel ? channel.name : channelId}>
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-base font-semibold text-fg">
              {channel ? `#${channel.name}` : "チャンネルが見つかりません"}
            </p>
            <p className="text-sm leading-6 text-fg-muted">
              {channel?.kind === "voice"
                ? "ボイスチャンネルの画面は #9 で実装します。"
                : "URL のチャンネルIDを確認してください。"}
            </p>
          </div>
        </MainPane>
      )}
    </>
  );
}

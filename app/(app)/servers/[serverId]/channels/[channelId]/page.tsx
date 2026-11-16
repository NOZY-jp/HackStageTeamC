import { ChannelSidebar } from "@/components/channel-sidebar";
import { MainPane } from "@/components/main-pane";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ serverId: string; channelId: string }>;
}) {
  const { serverId, channelId } = await params;

  return (
    <>
      <ChannelSidebar guildId={serverId} channelId={channelId} />
      <MainPane label="チャンネル" heading={`#${channelId}`}>
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-base font-semibold text-fg">
            #{channelId}（サーバー {serverId}）
          </p>
          <p className="text-sm leading-6 text-fg-muted">
            メッセージの表示はデータ層の実装後に接続します。
          </p>
        </div>
      </MainPane>
    </>
  );
}

import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import { getGuild, getUser, listChannels, listVoiceStates } from "@/lib/discord-like";
import { ChannelTree, type SidebarSection } from "./channel-tree";
import { SidebarPane } from "./sidebar-pane";
import { SidebarUserPanel } from "./sidebar-user-panel";

/**
 * チャンネル一覧の中ペイン（サーバー画面用）。
 * 外枠は SidebarPane なので、#10 は SidebarPane に DM 用の中身を渡せば差し替えられる。
 */
export function ChannelSidebar({ guildId, channelId }: { guildId: string; channelId: string }) {
  const guild = getGuild(guildId);

  if (!guild) {
    return (
      <SidebarPane
        label="チャンネル一覧"
        title="サーバー"
        footer={<SidebarUserPanel userId={SELF_USER_ID} />}
      >
        <p className="sidebar-empty">このサーバーは見つかりませんでした。</p>
      </SidebarPane>
    );
  }

  const channels = listChannels(guildId); // position 昇順
  const selfUser = getUser(SELF_USER_ID);
  const currentUser = {
    id: SELF_USER_ID,
    displayName: selfUser?.displayName ?? "自分",
    avatarColor: selfUser?.avatarColor ?? "transparent",
  };
  const sections: SidebarSection[] = [];

  // カテゴリ未所属は先頭にまとめる
  const uncategorized = channels.filter((channel) => !channel.categoryId);
  if (uncategorized.length > 0) {
    sections.push({
      id: "uncategorized",
      name: null,
      channels: uncategorized.map((channel) => toSidebarChannel(channel)),
    });
  }

  const categories = [...guild.categories].sort((a, b) => a.position - b.position);
  for (const category of categories) {
    sections.push({
      id: category.id,
      name: category.name,
      channels: channels
        .filter((channel) => channel.categoryId === category.id)
        .map((channel) => toSidebarChannel(channel)),
    });
  }

  return (
    <SidebarPane
      label="チャンネル一覧"
      title={guild.name}
      footer={<SidebarUserPanel userId={SELF_USER_ID} />}
    >
      <ChannelTree
        guildId={guildId}
        activeChannelId={channelId}
        sections={sections}
        currentUser={currentUser}
      />
    </SidebarPane>
  );

  function toSidebarChannel(channel: (typeof channels)[number]) {
    return {
      id: channel.id,
      name: channel.name,
      kind: channel.kind,
      unread: (channel.unreadCount ?? 0) > 0,
      mentionCount: channel.mentionCount ?? 0,
      participants:
        channel.kind === "voice"
          ? listVoiceStates(channel.id).map((state) => {
              const user = getUser(state.userId);
              return {
                id: state.userId,
                displayName: user?.displayName ?? state.userId,
                avatarColor: user?.avatarColor ?? "transparent",
              };
            })
          : [],
    };
  }
}

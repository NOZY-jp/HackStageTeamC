import { Suspense } from "react";
import { SELF_USER_ID } from "@/app/(discord-like)/_components/self-user";
import { getGuild, getUser, listChannels, listVoiceStates } from "@/lib/discord-like";
import { ChannelTree, type SidebarSection } from "./channel-tree";
import { SidebarPane } from "./sidebar-pane";

/** 一覧が読み込み中でも中ペインの骨格を保つための行（#70）。 */
const SKELETON_ROWS = [88, 72, 64, 78, 58, 70, 62, 66];

/**
 * チャンネル一覧の中ペイン（サーバー画面用）。
 * layout から描画し、チャンネル移動で作り直さない（#70）。
 * 選択中のチャンネルは一覧側が pathname から決める。
 */
export function ChannelSidebar({ guildId }: { guildId: string }) {
  const guild = getGuild(guildId);

  if (!guild) {
    return (
      <SidebarPane label="チャンネル一覧" title="サーバー">
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
    <SidebarPane label="チャンネル一覧" title={guild.name}>
      {/* 選択中チャンネルは pathname から決めるため、境界で囲む（cacheComponents） */}
      <Suspense
        fallback={
          <div className="skeleton-pane" aria-hidden="true">
            {SKELETON_ROWS.map((width) => (
              <span
                key={width}
                className="skeleton-block skeleton-row"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        }
      >
        <ChannelTree
          guildId={guild.id}
          guildUrlId={guild.urlId}
          sections={sections}
          currentUser={currentUser}
        />
      </Suspense>
    </SidebarPane>
  );

  function toSidebarChannel(channel: (typeof channels)[number]) {
    return {
      id: channel.id,
      urlId: channel.urlId,
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

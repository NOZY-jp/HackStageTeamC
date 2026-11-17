"use client";

import Link from "next/link";
import { useState } from "react";
import { useVoice } from "@/app/(discord-like)/_components/voice-context";
import { guildChannelPath } from "@/lib/platform/app-prefix";

export type SidebarChannel = {
  id: string;
  /** URL に出す数値ID（channel の urlId） */
  urlId: string;
  name: string;
  kind: "text" | "voice";
  unread: boolean;
  mentionCount: number;
  participants: { id: string; displayName: string; avatarColor: string }[];
};

export type SidebarSection = {
  id: string;
  /** カテゴリ未所属のまとまりは見出しを出さない（null） */
  name: string | null;
  channels: SidebarChannel[];
};

/**
 * カテゴリ → チャンネルの一覧。折りたたみ状態だけをクライアントで持つ
 * （リロードで初期状態＝すべて開いた状態に戻る）。
 */
export function ChannelTree({
  guildUrlId,
  activeChannelId,
  sections,
  currentUser,
}: {
  /** URL に出す guild の数値ID */
  guildUrlId: string;
  activeChannelId: string;
  sections: SidebarSection[];
  currentUser: { id: string; displayName: string; avatarColor: string };
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { connection } = useVoice();

  return (
    <div>
      {sections.map((section) => {
        const isCollapsed = collapsed[section.id] ?? false;
        return (
          <section key={section.id} aria-label={section.name ?? "カテゴリ未所属"}>
            {section.name ? (
              <h3>
                <button
                  type="button"
                  className="sidebar-section-button"
                  aria-expanded={!isCollapsed}
                  onClick={() => {
                    setCollapsed((previous) => ({ ...previous, [section.id]: !isCollapsed }));
                  }}
                >
                  <span>{section.name}</span>
                  {/* チューザは名前の右（展開=下向き / 折りたたみ=右向き） */}
                  <span
                    aria-hidden="true"
                    className="sidebar-caret"
                    data-collapsed={isCollapsed ? "true" : undefined}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 12"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3 4.5 3 3 3-3" />
                    </svg>
                  </span>
                </button>
              </h3>
            ) : null}

            {isCollapsed ? null : (
              <ul>
                {section.channels.map((channel) => {
                  const shown = withSelf(channel, connection?.channelId, currentUser);
                  return (
                    <li key={channel.id}>
                      <ChannelLink
                        guildUrlId={guildUrlId}
                        channel={shown}
                        active={channel.id === activeChannelId}
                      />
                      {shown.kind === "voice" && shown.participants.length > 0 ? (
                        <ul className="voice-members" aria-label={`${channel.name} の参加者`}>
                          {shown.participants.map((participant) => (
                            <li key={participant.id} className="voice-member">
                              <span
                                aria-hidden="true"
                                className="voice-avatar"
                                style={{ backgroundColor: participant.avatarColor }}
                              />
                              <span className="truncate">{participant.displayName}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** 参加中のVCには自分を参加者として足す（サイドバーの表示用）。 */
function withSelf(
  channel: SidebarChannel,
  joinedChannelId: string | undefined,
  currentUser: { id: string; displayName: string; avatarColor: string },
): SidebarChannel {
  if (channel.kind !== "voice" || joinedChannelId !== channel.id) {
    return channel;
  }
  return { ...channel, participants: [...channel.participants, selfParticipant(currentUser)] };
}

function selfParticipant(currentUser: { id: string; displayName: string; avatarColor: string }) {
  return {
    id: currentUser.id,
    displayName: `${currentUser.displayName}（自分）`,
    avatarColor: currentUser.avatarColor,
  };
}

function ChannelLink({
  guildUrlId,
  channel,
  active,
}: {
  guildUrlId: string;
  channel: SidebarChannel;
  active: boolean;
}) {
  const label = [
    channel.kind === "text"
      ? `テキストチャンネル ${channel.name}`
      : `ボイスチャンネル ${channel.name}`,
    channel.unread ? "未読あり" : "",
    channel.mentionCount > 0 ? `メンション${channel.mentionCount}件` : "",
  ]
    .filter(Boolean)
    .join("、");

  return (
    <Link
      href={guildChannelPath(guildUrlId, channel.urlId)}
      className="sidebar-item"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      data-unread={channel.unread ? "true" : undefined}
    >
      {channel.kind === "text" ? (
        <span aria-hidden="true" className="sidebar-icon">
          #
        </span>
      ) : (
        <svg
          aria-hidden="true"
          className="sidebar-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        </svg>
      )}
      <span className="truncate">{channel.name}</span>
      {channel.mentionCount > 0 ? (
        <span aria-hidden="true" className="sidebar-badge">
          {channel.mentionCount > 99 ? "99+" : channel.mentionCount}
        </span>
      ) : null}
    </Link>
  );
}

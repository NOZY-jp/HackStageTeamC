"use client";

import Link from "next/link";
import { useState } from "react";

export type SidebarChannel = {
  id: string;
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
  guildId,
  activeChannelId,
  sections,
}: {
  guildId: string;
  activeChannelId: string;
  sections: SidebarSection[];
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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
                  <span
                    aria-hidden="true"
                    className="sidebar-caret"
                    data-collapsed={isCollapsed ? "true" : undefined}
                  >
                    ▾
                  </span>
                  <span>{section.name}</span>
                </button>
              </h3>
            ) : null}

            {isCollapsed ? null : (
              <ul>
                {section.channels.map((channel) => (
                  <li key={channel.id}>
                    <ChannelLink
                      guildId={guildId}
                      channel={channel}
                      active={channel.id === activeChannelId}
                    />
                    {channel.kind === "voice" && channel.participants.length > 0 ? (
                      <ul className="voice-members" aria-label={`${channel.name} の参加者`}>
                        {channel.participants.map((participant) => (
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
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ChannelLink({
  guildId,
  channel,
  active,
}: {
  guildId: string;
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
      href={`/servers/${guildId}/channels/${channel.id}`}
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

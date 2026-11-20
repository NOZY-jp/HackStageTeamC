"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useStoryVoice } from "@/components/common/story/story-provider";
import { PaneToggles } from "@/components/discord-like/pane-toggles";
import { getUser } from "@/lib/discord-like";
import { guildChannelPath } from "@/lib/platform/app-prefix";
import { VOICE_CHANNELS, type VoiceChannel, type VoiceRoom } from "@/lib/story";
import { EmptyState } from "./empty-state";
import { STORY_USERS } from "./story-users";
import { useVoice } from "./voice-context";

/** 物語の通話の場所（このボイスチャンネルで物語が通話していれば、その名前） */
function storyChannelOf(channelId: string): VoiceChannel | undefined {
  const key = `discord:${channelId}`;
  return key in VOICE_CHANNELS ? (key as VoiceChannel) : undefined;
}

/** 物語の通話にいる人を、参加者タイルの形にする（自分＝リョウは自分のタイルで出すので除く） */
function storyParticipants(room: VoiceRoom | undefined): VoiceParticipant[] {
  return (room?.members ?? []).flatMap((member) => {
    if (member.who === "ryo") return [];
    const user = getUser(STORY_USERS[member.who]);
    return [
      {
        id: `story-${member.who}`,
        displayName: user?.displayName ?? member.who,
        avatarColor: user?.avatarColor ?? "transparent",
        speaking: room?.speaking === member.who,
        muted: member.muted,
      },
    ];
  });
}

/**
 * 物語の通話でリョウが出たら、自分も切断する（物語の中の「通話退出」）。
 * 入ってから出た場合だけ切断する（物語がまだ始まっていない・終わったときは何もしない）。
 */
function useStoryLeave(room: VoiceRoom | undefined, joined: boolean, leave: () => void) {
  const inCall = room?.members.some((member) => member.who === "ryo") ?? false;
  const wasInCall = useRef(false);
  useEffect(() => {
    if (wasInCall.current && room && !inCall && joined) {
      leave();
    }
    wasInCall.current = inCall;
  }, [room, inCall, joined, leave]);
}

type VoiceParticipant = {
  id: string;
  displayName: string;
  avatarColor: string;
  speaking?: boolean;
  muted?: boolean;
  deafened?: boolean;
};

/**
 * VC画面。参加者タイルと切断・トグルのみ。
 * VCを開いた時点で自動参加する（Discord と同じ）。退出は「切断」。
 * 実音声・マイク権限・WebRTC は使わない（音は出ないのが仕様）。
 */
export function VoiceChannelView({
  guildId,
  guildUrlId,
  channelId,
  channelUrlId,
  channelName,
  participants,
  currentUser,
}: {
  guildId: string;
  /** URL に出す guild の数値ID */
  guildUrlId: string;
  channelId: string;
  /** URL に出す channel の数値ID */
  channelUrlId: string;
  channelName: string;
  participants: VoiceParticipant[];
  currentUser: { id: string; displayName: string; avatarColor: string };
}) {
  const { connection, leftChannelId, join, leave, toggleMute, toggleDeafen } = useVoice();
  const joined = connection?.channelId === channelId;
  const muted = joined ? connection.muted : false;
  // 物語の場面がこの通話で流れているあいだは、物語の人物も参加者に出す（話している人は光る）
  const room = useStoryVoice(storyChannelOf(channelId));
  const shown = [...participants, ...storyParticipants(room)];
  useStoryLeave(room, joined, leave);
  const deafened = joined ? connection.deafened : false;

  // 表示中のページだけが自動参加する（ルートキャッシュで裏に残った画面が奪わないように）
  const pathname = usePathname();
  const active = pathname === guildChannelPath(guildUrlId, channelUrlId);

  // このチャンネルに入ったら自動参加する。
  // 「一度処理したか」ではなく実際の接続状態で判定するので、
  // 往復で戻ってきたとき（route cache で裏に残っていた場合）も参加し直せる。
  // ユーザーがこのチャンネルで「切断」したときだけ抑止する（印は context 側で管理）。
  useEffect(() => {
    if (!active || connection?.channelId === channelId || leftChannelId === channelId) {
      return;
    }
    join({ guildId, channelId, channelName });
  }, [active, channelId, channelName, connection?.channelId, guildId, join, leftChannelId]);

  return (
    <main id="app-main" className="app-main" aria-label={channelName}>
      <header className="pane-header voice-header">
        <PaneToggles />
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="voice-header-icon"
        >
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        </svg>
        <h1 className="voice-header-title">{channelName}</h1>
      </header>

      <div className="pane-scroll voice-body">
        <section aria-label="参加者" className="voice-participants">
          {shown.length === 0 && !joined ? (
            <EmptyState
              kind="voice"
              title="参加者はいません"
              description="まだ誰も接続していません。"
            />
          ) : null}
          {shown.map((participant) => (
            <VoiceTile
              key={participant.id}
              name={participant.displayName}
              avatarColor={participant.avatarColor}
              speaking={Boolean(participant.speaking)}
              status={
                participant.muted ? "ミュート" : participant.deafened ? "スピーカーオフ" : "接続中"
              }
            />
          ))}
          {joined ? (
            <VoiceTile
              key={`self-${currentUser.id}`}
              name={`${currentUser.displayName}（自分）`}
              avatarColor={currentUser.avatarColor}
              speaking={room?.speaking === "ryo"}
              status={muted ? "ミュート" : deafened ? "スピーカーオフ" : "接続中"}
            />
          ) : null}
        </section>

        <div className="voice-actions">
          {joined ? (
            <>
              <button type="button" className="voice-button voice-button-danger" onClick={leave}>
                切断
              </button>
              <button
                type="button"
                className="voice-button"
                aria-label={muted ? "ミュートを解除" : "ミュート"}
                aria-pressed={muted}
                onClick={toggleMute}
              >
                {muted ? "ミュート中" : "マイク"}
              </button>
              <button
                type="button"
                className="voice-button"
                aria-label={deafened ? "スピーカーのオフを解除" : "スピーカーをオフ"}
                aria-pressed={deafened}
                onClick={toggleDeafen}
              >
                {deafened ? "スピーカーオフ" : "スピーカー"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function VoiceTile({
  name,
  avatarColor,
  speaking,
  status,
}: {
  name: string;
  avatarColor: string;
  speaking: boolean;
  status: string;
}) {
  return (
    <div className="voice-tile" data-speaking={speaking ? "true" : undefined}>
      <span
        aria-hidden="true"
        className="voice-tile-avatar"
        style={{ backgroundColor: avatarColor }}
      >
        {name.slice(0, 1)}
      </span>
      <span className="voice-tile-name">{name}</span>
      <span className="voice-tile-status">{status}</span>
    </div>
  );
}

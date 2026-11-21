"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useStoryVoice } from "@/components/common/story/story-provider";
import { PaneToggles } from "@/components/discord-like/pane-toggles";
import { getUser } from "@/lib/discord-like";
import { guildChannelPath } from "@/lib/platform/app-prefix";
import { VOICE_CHANNELS, type VoiceChannel, type VoiceRoom } from "@/lib/story";
import { CallStage } from "./call-stage";
import { EmptyState } from "./empty-state";
import { useOptionalLocalMessages } from "./local-messages-context";
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
  lastSessionMinutes,
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
  /** サーバーVCの直近通話（分）。VoiceSession から渡す（#150） */
  lastSessionMinutes?: number;
}) {
  const { connection, lastCall, join, leave, toggleMute, toggleDeafen } = useVoice();
  const localMessages = useOptionalLocalMessages();
  const joined = connection?.channelId === channelId;
  const muted = joined ? connection.muted : false;
  // 物語の場面がこの通話で流れているあいだは、物語の人物も参加者に出す（話している人は光る）
  const room = useStoryVoice(storyChannelOf(channelId));
  const shown = [...participants, ...storyParticipants(room)];
  useStoryLeave(room, joined, leave);

  // #149: 退出したら会話ログに「通話 N分」を残す（データは変更しない）
  const joinedAtRef = useRef<string | null>(null);
  useEffect(() => {
    if (joined) {
      joinedAtRef.current = connection?.joinedAt ?? new Date().toISOString();
      return;
    }
    if (!joinedAtRef.current) return;
    const minutes = Math.max(1, Math.round((Date.now() - Date.parse(joinedAtRef.current)) / 60000));
    localMessages?.addMessage(channelId, `通話 ${minutes}分`, { system: true });
    joinedAtRef.current = null;
  }, [channelId, connection?.joinedAt, joined, localMessages]);
  const deafened = joined ? connection.deafened : false;

  // 表示中のページだけが自動参加する（ルートキャッシュで裏に残った画面が奪わないように）
  const pathname = usePathname();
  const active = pathname === guildChannelPath(guildUrlId, channelUrlId);

  const joinChannel = useCallback(() => {
    join({ guildId, channelId, channelName });
  }, [channelId, channelName, guildId, join]);

  // 画面への入場をきっかけに自動参加する。切断で接続状態だけが変わっても再参加しない。
  useEffect(() => {
    if (active) joinChannel();
  }, [active, joinChannel]);

  // 自分（1人でも破綻しないよう、参加者タイルに必ず入れる）
  const selfTile: VoiceParticipant = {
    id: `self-${currentUser.id}`,
    displayName: `${currentUser.displayName}（自分）`,
    avatarColor: currentUser.avatarColor,
    speaking: room?.speaking === "ryo",
    muted,
    deafened,
  };
  const tiles = joined ? [...shown, selfTile] : shown;
  const previousCallMinutes =
    lastCall?.channelId === channelId ? lastCall.minutes : lastSessionMinutes;

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
        {!joined ? (
          <div className="voice-actions">
            <button
              type="button"
              className="voice-button voice-button-primary"
              onClick={joinChannel}
            >
              通話に参加
            </button>
            {previousCallMinutes !== undefined ? (
              <p className="voice-last-call" data-testid="voice-last-call">
                前回の通話: {previousCallMinutes}分
              </p>
            ) : null}
          </div>
        ) : null}
        {tiles.length > 0 ? (
          <CallStage
            title={channelName}
            subtitle={
              !joined
                ? undefined
                : tiles.length > 1
                  ? `${tiles.length}人が参加中`
                  : "ひとりで接続しています"
            }
            joined={joined}
            muted={muted}
            deafened={deafened}
            participants={tiles}
            onToggleMute={toggleMute}
            onToggleDeafen={toggleDeafen}
            onLeave={leave}
            startedAt={joined ? connection?.joinedAt : undefined}
          />
        ) : (
          <EmptyState kind="voice" title="参加者はいません" />
        )}
      </div>
    </main>
  );
}

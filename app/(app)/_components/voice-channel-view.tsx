"use client";

import { PaneToggles } from "@/components/pane-toggles";
import { useVoice } from "./voice-context";

type VoiceParticipant = {
  id: string;
  displayName: string;
  avatarColor: string;
  speaking?: boolean;
  muted?: boolean;
  deafened?: boolean;
};

/**
 * VC画面。参加者タイルと参加/切断・トグルのみ。
 * 実音声・マイク権限・WebRTC は使わない（音は出ないのが仕様）。
 */
export function VoiceChannelView({
  guildId,
  channelId,
  channelName,
  participants,
  currentUser,
}: {
  guildId: string;
  channelId: string;
  channelName: string;
  participants: VoiceParticipant[];
  currentUser: { id: string; displayName: string; avatarColor: string };
}) {
  const { connection, join, leave, toggleMute, toggleDeafen } = useVoice();
  const joined = connection?.channelId === channelId;
  const muted = joined ? connection.muted : false;
  const deafened = joined ? connection.deafened : false;

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
          {participants.map((participant) => (
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
              speaking={false}
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
          ) : (
            <button
              type="button"
              className="voice-button voice-button-primary"
              onClick={() => join({ guildId, channelId, channelName })}
            >
              参加
            </button>
          )}
        </div>

        <p className="voice-note">この画面は見た目だけの疑似参加です。音声の送受信は行いません。</p>
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

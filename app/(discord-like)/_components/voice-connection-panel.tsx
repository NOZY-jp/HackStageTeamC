"use client";

import Link from "next/link";
import { useVoice } from "./voice-context";

/**
 * シェル下部に固定する接続パネル。参加中だけ出る。
 * 音は出ない（この Issue の仕様）。トグルは押下状態を保持するだけでデバイスは触らない。
 */
export function VoiceConnectionPanel() {
  const { connection, leave, toggleMute, toggleDeafen } = useVoice();

  if (!connection) {
    return null;
  }

  return (
    <section aria-label="接続パネル" className="voice-panel">
      <Link
        href={`/servers/${connection.guildId}/channels/${connection.channelId}`}
        className="voice-panel-channel"
      >
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
        >
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        </svg>
        <span className="voice-panel-text">
          <span className="voice-panel-name">{connection.channelName}</span>
          <span className="voice-panel-status">接続中（音は出ません）</span>
        </span>
      </Link>

      <div className="voice-panel-actions">
        <button
          type="button"
          className="voice-panel-button"
          aria-label={connection.muted ? "ミュートを解除" : "ミュート"}
          aria-pressed={connection.muted}
          onClick={toggleMute}
        >
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
          >
            <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            {connection.muted ? <path d="m4 4 16 16" /> : null}
          </svg>
        </button>
        <button
          type="button"
          className="voice-panel-button"
          aria-label={connection.deafened ? "スピーカーのオフを解除" : "スピーカーをオフ"}
          aria-pressed={connection.deafened}
          onClick={toggleDeafen}
        >
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
          >
            <path d="M3 10v4h3l4 4V6L6 10H3Z" />
            <path d="M15 9a4 4 0 0 1 0 6" />
            {connection.deafened ? <path d="m4 4 16 16" /> : null}
          </svg>
        </button>
        <button type="button" className="voice-panel-leave" onClick={leave}>
          切断
        </button>
      </div>
    </section>
  );
}

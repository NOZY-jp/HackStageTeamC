"use client";

import { useEffect, useState } from "react";
export type CallParticipant = {
  id: string;
  displayName: string;
  avatarColor: string;
  speaking?: boolean;
  muted?: boolean;
  deafened?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  connected: "接続中",
  idle: "待機中",
};

/** 通話の経過時間（mm:ss / h:mm:ss）。開始からの差分だけを出す。 */
function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** 接続しているあいだだけ進む経過時間。 */
function useCallTimer(running: boolean): string {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!running) {
      setStartedAt(null);
      return;
    }
    setStartedAt(Date.now());
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  if (startedAt === null) {
    return "0:00";
  }
  return formatElapsed(now - startedAt);
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      {muted ? <path d="M4 4l16 16" /> : null}
    </svg>
  );
}

function SpeakerIcon({ off }: { off: boolean }) {
  return (
    <svg
      aria-hidden="true"
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
      {off ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7" />}
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M9 21h6M12 17v4" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10c6-4 12-4 18 0v4l-4 1-2-3H9l-2 3-4-1Z" />
    </svg>
  );
}

function Tile({ participant }: { participant: CallParticipant }) {
  const status = participant.deafened
    ? "スピーカーオフ"
    : participant.muted
      ? "ミュート"
      : participant.speaking
        ? "話しています"
        : "接続中";
  return (
    <li
      className="call-tile"
      data-speaking={participant.speaking ? "true" : undefined}
      data-muted={participant.muted || participant.deafened ? "true" : undefined}
    >
      <span
        aria-hidden="true"
        className="call-tile-avatar"
        style={{ backgroundColor: participant.avatarColor }}
      >
        {participant.displayName.slice(0, 1)}
      </span>
      <span className="call-tile-label">
        <span className="call-tile-name">{participant.displayName}</span>
        <span
          className="call-tile-badge"
          data-state={participant.muted || participant.deafened ? "muted" : "on"}
        >
          <MicIcon muted={Boolean(participant.muted || participant.deafened)} />
          <span className="sr-only">{status}</span>
        </span>
      </span>
    </li>
  );
}

/**
 * 通話画面（サーバーのVC・DMの通話で共通）。
 * - 参加者タイル・経過時間・接続状態は常に見える
 * - 操作（ミュート・スピーカー・切断）はホバー中かフォーカス中だけ出す（レイアウトは動かさない）
 * - 出ていないあいだボタンは Tab で到達しない。通話エリア自体にフォーカスすると出る
 */
export function CallStage({
  title,
  joined,
  muted,
  deafened,
  participants,
  onToggleMute,
  onToggleDeafen,
  onLeave,
  subtitle,
  layout = "grid",
}: {
  title: string;
  joined: boolean;
  muted: boolean;
  deafened: boolean;
  participants: CallParticipant[];
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onLeave: () => void;
  subtitle?: string;
  /** grid = サーバーVC（並べる）/ dm = DM通話（相手を大きく、自分は右下の小窓） */
  layout?: "grid" | "dm";
}) {
  // ホバー中か、通話エリアの中にフォーカスがあるあいだだけ操作を出す
  const [active, setActive] = useState(false);
  const [focused, setFocused] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);
  const controlsVisible = active || focused;
  const elapsed = useCallTimer(joined);
  const tabIndex = controlsVisible ? 0 : -1;

  return (
    <section
      className="call-stage"
      aria-label="通話"
      data-connected={joined ? "true" : "false"}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      {/* キーボードでも操作を出せる入口（見た目は出さない）。フォーカスすると操作バーが出る */}
      {joined ? (
        <button
          type="button"
          className="call-reveal sr-only"
          onClick={() => setActive(true)}
          onFocus={() => setFocused(true)}
        >
          通話の操作を表示
        </button>
      ) : null}

      <div className="call-stage-info">
        <h2 className="call-stage-title">{title}</h2>
        <p className="call-stage-meta">
          <span className="call-stage-status" data-connected={joined ? "true" : "false"}>
            {joined ? STATUS_LABELS.connected : "未接続"}
          </span>
          {joined ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="call-stage-timer">
                <span className="sr-only">通話時間 </span>
                {elapsed}
              </span>
            </>
          ) : null}
          {joined && muted ? <span className="call-stage-flag">ミュート中</span> : null}
          {joined && deafened ? <span className="call-stage-flag">スピーカーオフ</span> : null}
        </p>
        {subtitle ? <p className="call-stage-subtitle">{subtitle}</p> : null}
      </div>

      <ul
        className="call-tiles"
        aria-label="参加者"
        data-count={participants.length}
        data-layout={layout}
      >
        {participants.map((participant) => (
          <Tile key={participant.id} participant={participant} />
        ))}
      </ul>

      {joined ? (
        <div className="call-controls" data-visible={controlsVisible ? "true" : "false"}>
          <button
            type="button"
            className="voice-button"
            tabIndex={tabIndex}
            aria-label="画面共有（準備中）"
            aria-pressed={shareNotice}
            onClick={() => setShareNotice((value) => !value)}
          >
            <ShareIcon />
            <span>画面共有</span>
          </button>
          <button
            type="button"
            className="voice-button"
            tabIndex={tabIndex}
            aria-label={muted ? "ミュートを解除" : "ミュート"}
            aria-pressed={muted}
            onClick={onToggleMute}
          >
            <MicIcon muted={muted} />
            <span>{muted ? "ミュート中" : "ミュート"}</span>
          </button>
          <button
            type="button"
            className="voice-button"
            tabIndex={tabIndex}
            aria-label={deafened ? "スピーカーのオフを解除" : "スピーカーをオフ"}
            aria-pressed={deafened}
            onClick={onToggleDeafen}
          >
            <SpeakerIcon off={deafened} />
            <span>{deafened ? "スピーカーオン" : "スピーカーオフ"}</span>
          </button>
          <button
            type="button"
            className="voice-button voice-button-danger"
            tabIndex={tabIndex}
            aria-label="切断"
            onClick={onLeave}
          >
            <LeaveIcon />
            <span>切断</span>
          </button>
          {shareNotice ? (
            <span className="call-controls-note" role="status">
              画面共有は準備中です
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export { formatElapsed };

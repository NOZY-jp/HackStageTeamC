"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  calling: "呼び出し中",
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
function useCallTimer(running: boolean, startedAtIso?: string): string {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!running) {
      setStartedAt(null);
      return;
    }
    const base = startedAtIso ? Date.parse(startedAtIso) : Date.now();
    setStartedAt(Number.isNaN(base) ? Date.now() : base);
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running, startedAtIso]);

  if (startedAt === null) {
    return "0:00";
  }
  return formatElapsed(now - startedAt);
}

function MicIcon({ muted, size = 14 }: { muted: boolean; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
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

function PeopleIcon() {
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
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4" />
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
        <span
          className="call-tile-badge"
          data-state={participant.muted || participant.deafened ? "muted" : "on"}
        >
          <MicIcon muted={Boolean(participant.muted || participant.deafened)} />
          <span className="sr-only">{status}</span>
        </span>
        <span className="call-tile-name">{participant.displayName}</span>
      </span>
    </li>
  );
}

/**
 * 通話画面（サーバーのVC・DMの通話で共通）。
 * - 参加者タイル・経過時間・接続状態は常に見える
 * - 操作（画面共有・ミュート・スピーカー・参加者・招待・切断）はホバー中かフォーカス中だけ出す
 * - 画面共有中はステージに共有中の表示、参加者は右に寄せる
 * - 発話は数秒おきに切り替わる（prefers-reduced-motion では動かさない）
 */
export function CallStage({
  title,
  joined,
  connecting = false,
  muted,
  deafened,
  participants,
  onToggleMute,
  onToggleDeafen,
  onLeave,
  startedAt,
  subtitle,
  layout = "grid",
  selfId,
  inviteUrl,
  speakingIntervalMs = 4000,
}: {
  title?: string;
  joined: boolean;
  /** 呼び出し中（入室直後の約1秒）。0:00 のまま「呼び出し中」を出す */
  connecting?: boolean;
  muted: boolean;
  deafened: boolean;
  participants: CallParticipant[];
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onLeave: () => void;
  /** 接続開始時刻（ISO）。渡すとタイマーの起点になる（#150） */
  startedAt?: string;
  subtitle?: string;
  /** grid = サーバーVC（並べる）/ dm = DM通話（相手を大きく、自分は右下の小窓） */
  layout?: "grid" | "dm";
  /** 自分の参加者ID（DMの小窓を判別する） */
  selfId?: string;
  /** 招待リンク（省略時は現在のURL） */
  inviteUrl?: string;
  /** 発話表示の切り替え間隔（テストで注入する） */
  speakingIntervalMs?: number;
}) {
  const [active, setActive] = useState(false);
  const [focused, setFocused] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [speakerId, setSpeakerId] = useState<string | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsVisible = active || focused;
  const connected = joined && !connecting;
  const elapsed = useCallTimer(connected, startedAt);
  const tabIndex = controlsVisible ? 0 : -1;

  // 発話の切り替え（固定の「話しています」をやめる）。動きを減らす設定では止める。
  useEffect(() => {
    if (!connected || sharing || participants.length === 0) {
      setSpeakerId(null);
      return;
    }
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setSpeakerId(null);
      return;
    }
    const others = participants.filter((participant) => participant.id !== selfId);
    if (others.length === 0) {
      setSpeakerId(null);
      return;
    }
    let index = 0;
    setSpeakerId(null);
    const timer = setInterval(() => {
      index = (index + 1) % (others.length + 1);
      setSpeakerId(index === 0 ? null : others[index - 1].id);
    }, speakingIntervalMs);
    return () => clearInterval(timer);
  }, [connected, participants, selfId, sharing, speakingIntervalMs]);

  useEffect(
    () => () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
    },
    [],
  );

  const showNote = useCallback((text: string) => {
    setNote(text);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 2000);
  }, []);

  const copyInvite = useCallback(async () => {
    const url = inviteUrl ?? (typeof window !== "undefined" ? window.location.href : "");
    try {
      await navigator.clipboard?.writeText(url);
    } catch {
      // クリップボードが使えなくても、案内だけ出す（モック）
    }
    showNote("招待リンクをコピーしました");
  }, [inviteUrl, showNote]);

  const shown = useMemo(
    () =>
      participants.map((participant) => ({
        ...participant,
        speaking: participant.id === speakerId,
      })),
    [participants, speakerId],
  );

  return (
    <section
      className="call-stage"
      aria-label="通話"
      data-connected={connected ? "true" : "false"}
      data-connecting={connecting ? "true" : "false"}
      data-sharing={sharing ? "true" : "false"}
      data-layout={layout}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
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

      {layout === "dm" ? (
        <div className="call-stage-info call-stage-info-dm">
          <p className="call-stage-meta">
            <span className="call-stage-status" data-connected={connected ? "true" : "false"}>
              {connecting
                ? STATUS_LABELS.calling
                : connected
                  ? STATUS_LABELS.connected
                  : STATUS_LABELS.idle}
            </span>
            <span aria-hidden="true">·</span>
            <span className="call-stage-count">{shown.length}人</span>
            <span aria-hidden="true">·</span>
            <span className="call-stage-timer">
              <span className="sr-only">通話時間 </span>
              {elapsed}
            </span>
            {muted ? <span className="call-stage-flag">ミュート中</span> : null}
            {deafened ? <span className="call-stage-flag">スピーカーオフ</span> : null}
          </p>
        </div>
      ) : (
        <div className="call-stage-info">
          {title ? <h2 className="call-stage-title">{title}</h2> : null}
          <p className="call-stage-meta">
            <span className="call-stage-status" data-connected={connected ? "true" : "false"}>
              {connecting
                ? STATUS_LABELS.calling
                : connected
                  ? STATUS_LABELS.connected
                  : STATUS_LABELS.idle}
            </span>
            {connected ? (
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
      )}

      {sharing ? (
        <div className="call-share" role="status">
          <p>画面を共有しています</p>
          <span className="call-share-hint">停止するには操作バーの「共有を停止」</span>
        </div>
      ) : null}

      <ul
        className="call-tiles"
        aria-label="参加者"
        data-count={shown.length}
        data-layout={layout}
        data-sharing={sharing ? "true" : undefined}
      >
        {shown.map((participant) => (
          <Tile key={participant.id} participant={participant} />
        ))}
      </ul>

      {panelOpen ? (
        <aside className="call-participants" aria-label="参加者一覧">
          <h3>参加者 — {shown.length}</h3>
          <ul>
            {shown.map((participant) => (
              <li key={participant.id}>
                <span
                  aria-hidden="true"
                  className="call-participants-avatar"
                  style={{ backgroundColor: participant.avatarColor }}
                >
                  {participant.displayName.slice(0, 1)}
                </span>
                <span>{participant.displayName}</span>
                <span
                  className="call-participants-mic"
                  data-state={participant.muted ? "muted" : "on"}
                >
                  <MicIcon muted={Boolean(participant.muted || participant.deafened)} />
                </span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      {joined ? (
        <div className="call-controls" data-visible={controlsVisible ? "true" : "false"}>
          <button
            type="button"
            className="voice-button"
            tabIndex={tabIndex}
            aria-label={sharing ? "共有を停止" : "画面共有"}
            aria-pressed={sharing}
            onClick={() => setSharing((value) => !value)}
          >
            <ShareIcon />
            <span>{sharing ? "共有を停止" : "画面共有"}</span>
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
            className="voice-button"
            tabIndex={tabIndex}
            aria-label="参加者一覧"
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((value) => !value)}
          >
            <PeopleIcon />
            <span>参加者</span>
          </button>
          <button
            type="button"
            className="voice-button"
            tabIndex={tabIndex}
            aria-label="招待リンクをコピー"
            onClick={copyInvite}
          >
            <ShareIcon />
            <span>招待</span>
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
        </div>
      ) : null}
      {note ? (
        <p className="call-controls-note" role="status">
          {note}
        </p>
      ) : null}
    </section>
  );
}

export { formatElapsed };

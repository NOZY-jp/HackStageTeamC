"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PaneToggles } from "@/components/discord-like/pane-toggles";
import { dmThreadPath } from "@/lib/platform/app-prefix";
import { CallStage } from "./call-stage";
import { useLocalMessages } from "./local-messages-context";

/**
 * DM の通話画面。相手のアバターを大きく中央に出し、自分は右下の小窓に置く。
 * 通話の開始・終了は会話ログ（システムメッセージ）に残す（データ側は変えない）。
 */
export function DmCallView({
  threadId,
  threadUrlId,
  self,
  other,
  otherHandle,
  connectDelayMs = 1000,
}: {
  threadId: string;
  threadUrlId: string;
  self: { displayName: string; avatarColor: string };
  other: { displayName: string; avatarColor: string };
  /** ヘッダーに出す相手のハンドル（例: maimaimaimai） */
  otherHandle?: string;
  /** 呼び出し中の長さ（テストで 0 にする） */
  connectDelayMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeCallThreadId, activeCallJoinedAt, startCall, endCall } = useLocalMessages();
  const [muted, setMuted] = useState(false);
  // 入室 → 呼び出し中（0:00）→ 接続、の2段階（直リンクでも「終了しました」を出さない）
  // 切断したあと、同じ画面に留まっているあいだは再接続しない（終了ログの後に開始ログを足さない）
  const [ended, setEnded] = useState(false);
  const [deafened, setDeafened] = useState(false);
  // 通話中かどうかは Provider が持つ（ページが再マウントされなくても再入場を拾える）
  const connected = activeCallThreadId === threadId;
  // 接続が成立するまでは「呼び出し中」（切断後は出さない）
  const connecting = !connected && !ended;

  // 通話画面に「入り直した」ことを検知する（SPA で同じ画面が再利用されても初期化する）。
  // 生成したパスと完全一致で比べると、末尾スラッシュや %40 の差で一致しないことがあるため、
  // 正規化した pathname が /call で終わるかで判定する。
  const normalizedPath = (pathname ?? "").replace(/\/+$/, "").replace(/%40/gi, "@");
  const onCallPath = normalizedPath.endsWith("/call");
  const [entry, setEntry] = useState(0);

  // 通話画面に「入り直した」ら、切断済みの状態を解いて再接続できるようにする
  // （同じ画面に留まったままの切断では entry が変わらないので、再接続しない）
  useEffect(() => {
    if (entry === 0) return;
    setEnded(false);
  }, [entry]);

  // 直リンクで開いたときも、呼び出し中のあとで通話を開始する（同じスレッドで二重開始はしない）
  useEffect(() => {
    if (ended || !onCallPath || connected) return;
    const timer = setTimeout(() => startCall(threadId), connectDelayMs);
    return () => clearTimeout(timer);
  }, [connectDelayMs, connected, ended, onCallPath, startCall, threadId]);

  useEffect(() => {
    if (!onCallPath) {
      // 通話画面を離れたら、次に来たときは再接続できるようにする
      setEnded(false);
      return;
    }
    setEntry((value) => value + 1);
  }, [onCallPath]);

  // 通話に入り直したらミュート・スピーカー状態も初期化する
  useEffect(() => {
    if (!connected) return;
    setMuted(false);
    setDeafened(false);
  }, [connected]);

  /** 通話を終える（切断ボタン・「チャットに戻る」のどちらでも同じ処理を通す）。 */
  const hangUp = () => {
    setEnded(true);
    endCall(threadId);
    router.push(dmThreadPath(threadUrlId));
  };

  return (
    <main
      id="app-main"
      className="app-main"
      aria-label={`${other.displayName} との通話`}
      data-call-entry={entry}
    >
      <header className="pane-header voice-header">
        <PaneToggles />
        <div className="voice-header-text">
          <h1 className="voice-header-title">{other.displayName}</h1>
          {otherHandle ? <p className="voice-header-handle">@{otherHandle}</p> : null}
        </div>
        <Link
          href={dmThreadPath(threadUrlId)}
          className="message-header-icon message-header-button"
          aria-label="チャットに戻る"
          onClick={() => {
            setEnded(true);
            endCall(threadId);
          }}
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
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
          </svg>
        </Link>
      </header>

      <div className="pane-scroll voice-body">
        <CallStage
          joined={connected}
          connecting={connecting}
          muted={muted}
          deafened={deafened}
          participants={
            connected || connecting
              ? [
                  {
                    id: `dm-other-${threadId}`,
                    displayName: other.displayName,
                    avatarColor: other.avatarColor,
                    speaking: true,
                  },
                  {
                    id: `dm-self-${threadId}`,
                    displayName: `${self.displayName}（自分）`,
                    avatarColor: self.avatarColor,
                    muted,
                    deafened,
                  },
                ]
              : []
          }
          onToggleMute={() => setMuted((value) => !value)}
          onToggleDeafen={() => setDeafened((value) => !value)}
          onLeave={hangUp}
          layout="dm"
          selfId={`dm-self-${threadId}`}
          startedAt={activeCallJoinedAt ?? undefined}
        />
      </div>
    </main>
  );
}

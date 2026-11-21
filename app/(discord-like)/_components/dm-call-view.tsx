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
}: {
  threadId: string;
  threadUrlId: string;
  self: { displayName: string; avatarColor: string };
  other: { displayName: string; avatarColor: string };
  /** ヘッダーに出す相手のハンドル（例: maimaimaimai） */
  otherHandle?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeCallThreadId, startCall, endCall } = useLocalMessages();
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  // 通話中かどうかは Provider が持つ（ページが再マウントされなくても再入場を拾える）
  const connected = activeCallThreadId === threadId;
  // 通話画面に「入り直した」ことを検知する（SPA で同じ画面が再利用されても初期化する）。
  // 生成したパスと完全一致で比べると、末尾スラッシュや %40 の差で一致しないことがあるため、
  // 正規化した pathname が /call で終わるかで判定する。
  const normalizedPath = (pathname ?? "").replace(/\/+$/, "").replace(/%40/gi, "@");
  const onCallPath = normalizedPath.endsWith("/call");
  const [entry, setEntry] = useState(0);

  // 直リンクで開いたときも通話を開始する（同じスレッドで二重開始はしない）
  useEffect(() => {
    startCall(threadId);
  }, [startCall, threadId]);

  useEffect(() => {
    if (!onCallPath) return;
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
          <h1 className="voice-header-title">{other.displayName} との通話</h1>
          {otherHandle ? <p className="voice-header-handle">@{otherHandle}</p> : null}
        </div>
        <Link
          href={dmThreadPath(threadUrlId)}
          className="message-header-icon message-header-button"
          aria-label="チャットに戻る"
          onClick={() => endCall(threadId)}
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
          title={`${other.displayName} との通話`}
          subtitle={connected ? "2人で通話中" : "通話は終了しました"}
          joined={connected}
          muted={muted}
          deafened={deafened}
          participants={
            connected
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
        />
      </div>
    </main>
  );
}

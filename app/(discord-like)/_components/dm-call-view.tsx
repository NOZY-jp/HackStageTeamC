"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const { addMessage } = useLocalMessages();
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [connected, setConnected] = useState(true);
  // 通話画面に「入り直した」ことを検知する（SPA で同じ画面が再利用されても初期化する）。
  // 生成したパスと完全一致で比べると、末尾スラッシュや %40 の差で一致しないことがあるため、
  // 正規化した pathname が /call で終わるかで判定する。
  const normalizedPath = (pathname ?? "").replace(/\/+$/, "").replace(/%40/gi, "@");
  const onCallPath = normalizedPath.endsWith("/call");
  const enteredRef = useRef(false);
  const [entry, setEntry] = useState(0);

  useEffect(() => {
    const onCall = onCallPath;
    if (onCall && !enteredRef.current) {
      // 入口で必ず初期化する（前回の connected=false を持ち越さない）
      enteredRef.current = true;
      setConnected(true);
      setMuted(false);
      setDeafened(false);
      setEntry((value) => value + 1);
      addMessage(threadId, "通話を開始しました", { system: true });
    }
    if (!onCall && enteredRef.current) {
      enteredRef.current = false;
    }
  }, [addMessage, onCallPath, threadId]);

  /** 通話を終える（切断ボタン・「チャットに戻る」のどちらでも同じ処理を通す）。 */
  const endCall = () => {
    if (!connected) {
      return;
    }
    addMessage(threadId, "通話を終了しました", { system: true });
    setConnected(false);
  };

  const hangUp = () => {
    endCall();
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
          onClick={endCall}
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

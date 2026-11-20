"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
}: {
  threadId: string;
  threadUrlId: string;
  self: { displayName: string; avatarColor: string };
  other: { displayName: string; avatarColor: string };
}) {
  const router = useRouter();
  const { addMessage } = useLocalMessages();
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [connected, setConnected] = useState(true);
  const logged = useRef(false);

  // 開始はこの画面に入った時点（1回だけログに残す）
  useEffect(() => {
    if (logged.current) {
      return;
    }
    logged.current = true;
    addMessage(threadId, "通話を開始しました");
  }, [addMessage, threadId]);

  const hangUp = () => {
    addMessage(threadId, "通話を終了しました");
    setConnected(false);
    router.push(dmThreadPath(threadUrlId));
  };

  return (
    <main id="app-main" className="app-main" aria-label={`${other.displayName} との通話`}>
      <header className="pane-header voice-header">
        <PaneToggles />
        <h1 className="voice-header-title">{other.displayName} との通話</h1>
        <Link
          href={dmThreadPath(threadUrlId)}
          className="message-header-icon message-header-button"
          aria-label="チャットに戻る"
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

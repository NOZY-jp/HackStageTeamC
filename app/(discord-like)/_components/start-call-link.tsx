"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocalMessages } from "./local-messages-context";

/**
 * 通話画面への導線（#140）。
 *
 * Next はページをルートキャッシュで保持し、`/call` へ戻っても通話画面が再マウントされない
 * ことがある。記録（通話ログ）は接続が成立した時点で `DmCallView` が行う（呼び出し中は残さない）。
 */
export function StartCallLink({
  href,
  threadId = "dm-maimai",
  className,
  ariaLabel,
  children,
}: {
  href: string;
  threadId?: string;
  className?: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  const { requestCall } = useLocalMessages();
  return (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={() => requestCall(threadId)}
    >
      {children}
    </Link>
  );
}

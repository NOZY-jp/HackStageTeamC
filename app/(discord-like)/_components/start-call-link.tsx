"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocalMessages } from "./local-messages-context";

/**
 * 通話画面への導線（#140）。
 *
 * Next はページをルートキャッシュで保持し、`/call` へ戻っても通話画面が再マウントされない
 * ことがある。そのため「開始」はクリック時点で Provider に記録する（ページの mount に頼らない）。
 */
export function StartCallLink({
  href,
  threadId,
  className,
  ariaLabel,
  children,
}: {
  href: string;
  threadId: string;
  className?: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  const { startCall } = useLocalMessages();
  return (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={() => startCall(threadId)}
    >
      {children}
    </Link>
  );
}

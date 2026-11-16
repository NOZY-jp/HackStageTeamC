"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useShellControls } from "./app-shell";

/** 左端のサーバーレール。現在のURLから選択状態だけを決める。 */
export function ServerRail() {
  const pathname = usePathname();
  const { closeOverlays } = useShellControls();
  const dmActive = pathname === "/dm" || pathname.startsWith("/dm/");
  const serverActive = pathname.startsWith("/servers/");

  // 画面遷移したときだけ、開いたままのオーバーレイを閉じる（初回マウントでは閉じない）
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }
    previousPathname.current = pathname;
    closeOverlays();
  }, [pathname, closeOverlays]);

  return (
    <nav aria-label="サーバー" id="app-rail" className="app-rail">
      <Link
        href="/dm"
        className="rail-button"
        aria-label="ダイレクトメッセージ"
        aria-current={dmActive ? "page" : undefined}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.8 8.8 0 0 1-3.8-.85L3 21l1.85-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" />
        </svg>
      </Link>

      <div className="rail-divider" aria-hidden="true" />

      <Link
        href="/servers/s1/channels/c1"
        className="rail-button"
        aria-label="サーバー（プレースホルダ）"
        aria-current={serverActive ? "page" : undefined}
      >
        <span aria-hidden="true" className="text-sm font-semibold">
          S
        </span>
      </Link>
    </nav>
  );
}

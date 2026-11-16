"use client";

import { useShellControls } from "./app-shell";

/** メインヘッダの開閉ボタン。表示される幅は CSS（.only-mobile / .only-compact）で決める。 */
export function PaneToggles() {
  const { sidebarOpen, railOpen, toggleSidebar, toggleRail } = useShellControls();

  return (
    <>
      <button
        type="button"
        className="pane-toggle only-mobile"
        aria-label="サーバー一覧を開く"
        aria-expanded={railOpen}
        aria-controls="app-rail"
        onClick={toggleRail}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        type="button"
        className="pane-toggle only-compact"
        aria-label="サイドバーを開く"
        aria-expanded={sidebarOpen}
        aria-controls="app-sidebar"
        onClick={toggleSidebar}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
        </svg>
      </button>
    </>
  );
}

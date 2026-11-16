"use client";

import { useShellControls } from "./app-shell";

/** オーバーレイ表示のときだけ出る、サイドバー内の閉じるボタン。 */
export function SidebarClose() {
  const { closeOverlays } = useShellControls();

  return (
    <button
      type="button"
      className="pane-toggle only-compact"
      aria-label="サイドバーを閉じる"
      onClick={closeOverlays}
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
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

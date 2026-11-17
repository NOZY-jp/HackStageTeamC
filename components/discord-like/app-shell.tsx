"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ShellControls = {
  sidebarOpen: boolean;
  railOpen: boolean;
  toggleSidebar: () => void;
  toggleRail: () => void;
  closeOverlays: () => void;
};

const ShellContext = createContext<ShellControls | null>(null);

export function useShellControls(): ShellControls {
  const controls = useContext(ShellContext);
  if (!controls) {
    throw new Error("useShellControls は AppShell の内側でだけ使えます");
  }
  return controls;
}

/**
 * 3ペインの外枠。オーバーレイ表示の開閉状態だけをクライアントで持つ。
 * 幅による切り替えは globals.css のメディアクエリで行い、JS では分岐しない。
 */
export function AppShell({
  rail,
  children,
  leftFooter,
}: {
  rail: ReactNode;
  children: ReactNode;
  /** 左ペイン（レール＋サイドバー）の下端に置く領域。ユーザー情報パネルなど。 */
  leftFooter?: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  const closeOverlays = useCallback(() => {
    setSidebarOpen(false);
    setRailOpen(false);
  }, []);

  // Esc でオーバーレイを閉じる（画面遷移時の閉じる処理はレール側が受け持つ）
  useEffect(() => {
    if (!sidebarOpen && !railOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeOverlays();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, railOpen, closeOverlays]);

  const controls = useMemo<ShellControls>(
    () => ({
      sidebarOpen,
      railOpen,
      toggleSidebar: () => setSidebarOpen((open) => !open),
      toggleRail: () => setRailOpen((open) => !open),
      closeOverlays,
    }),
    [sidebarOpen, railOpen, closeOverlays],
  );

  return (
    <ShellContext.Provider value={controls}>
      <div className="app-shell" data-sidebar-open={sidebarOpen} data-rail-open={railOpen}>
        <button
          type="button"
          className="app-backdrop"
          aria-label="メニューを閉じる"
          tabIndex={-1}
          onClick={closeOverlays}
        />
        {rail}
        {children}
        {leftFooter}
      </div>
    </ShellContext.Provider>
  );
}

import type { ReactNode } from "react";
import { SidebarClose } from "./sidebar-close";

/**
 * 中ペインの外枠。ランドマークは nav で、ヘッダにタイトルと閉じるボタンを持つ。
 * 中身は children で差し替えられる（#10 の DM 一覧は SidebarPane をそのまま使う）。
 * footer は下端固定（スクロールしない）で、ユーザーパネルなどに使う。
 */
export function SidebarPane({
  label,
  title,
  children,
  footer,
}: {
  label: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <nav aria-label={label} id="app-sidebar" className="app-sidebar">
      <div className="pane-header justify-between">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        <SidebarClose />
      </div>
      <div className="pane-scroll">{children}</div>
      {footer ? <div className="sidebar-footer">{footer}</div> : null}
    </nav>
  );
}

import type { ReactNode } from "react";
import { SidebarClose } from "./sidebar-close";

/** 中央ペイン。ランドマークは nav で、ヘッダにタイトルと閉じるボタンを持つ。 */
export function SidebarPane({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <nav aria-label={label} id="app-sidebar" className="app-sidebar">
      <div className="pane-header justify-between">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        <SidebarClose />
      </div>
      <div className="pane-scroll">{children}</div>
    </nav>
  );
}

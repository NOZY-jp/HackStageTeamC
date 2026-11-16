import type { ReactNode } from "react";
import { PaneToggles } from "./pane-toggles";

/** 右ペイン。ランドマークは main。ヘッダに開閉ボタンと画面タイトルを置く。 */
export function MainPane({
  label,
  heading,
  children,
}: {
  label: string;
  heading?: string;
  children: ReactNode;
}) {
  return (
    <main aria-label={label} id="app-main" className="app-main">
      <div className="pane-header">
        <PaneToggles />
        {heading ? <h1 className="text-sm font-semibold text-fg">{heading}</h1> : null}
      </div>
      <div className="pane-scroll">{children}</div>
    </main>
  );
}

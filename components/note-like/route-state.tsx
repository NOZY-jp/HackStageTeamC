import type { ReactNode } from "react";

/** 未検出・エラーの共通表示。操作（戻るリンクや再試行）は children で渡す。 */
export function RouteState({
  code,
  title,
  description,
  alert,
  children,
}: {
  code: string;
  title: string;
  description: string;
  alert?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="note-state" role={alert ? "alert" : undefined}>
      <p className="note-state-code" aria-hidden="true">
        {code}
      </p>
      <h1 className="note-state-title">{title}</h1>
      <p className="note-state-description">{description}</p>
      {children}
    </div>
  );
}

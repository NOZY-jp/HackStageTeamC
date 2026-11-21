import type { ReactNode } from "react";
import { BackButton } from "./back-button";

export function PageHeader({
  title,
  subtitle,
  backHref,
  titleBadge,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  titleBadge?: ReactNode;
}) {
  return (
    <div className="tw-page-header">
      {backHref ? <BackButton fallbackHref={backHref} /> : null}
      <div className="tw-page-header-text">
        <h1 className="tw-page-title">
          {title}
          {titleBadge}
        </h1>
        {subtitle ? <p className="tw-page-subtitle">{subtitle}</p> : null}
      </div>
    </div>
  );
}

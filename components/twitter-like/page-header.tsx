import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon } from "./icons";

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
      {backHref ? (
        <Link href={backHref} className="tw-back" aria-label="戻る">
          <BackIcon />
        </Link>
      ) : null}
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

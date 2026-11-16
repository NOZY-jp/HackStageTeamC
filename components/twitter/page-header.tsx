import Link from "next/link";
import { BackIcon } from "./icons";

export function PageHeader({
  title,
  subtitle,
  backHref,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <div className="tw-page-header">
      {backHref ? (
        <Link href={backHref} className="tw-back" aria-label="戻る">
          <BackIcon />
        </Link>
      ) : null}
      <div>
        <h1 className="tw-page-title">{title}</h1>
        {subtitle ? <p className="tw-page-subtitle">{subtitle}</p> : null}
      </div>
    </div>
  );
}

import Link from "next/link";
import { dmListPath } from "@/lib/platform/app-prefix";

export default function NotFound() {
  return (
    <div className="route-state">
      <p className="route-state-code" aria-hidden="true">
        404
      </p>
      <h1 className="route-state-title">ページが見つかりません</h1>
      <p className="route-state-description">URLを確認してください。</p>
      <Link href={dmListPath()} className="route-state-link">
        DMへ戻る
      </Link>
    </div>
  );
}

import Link from "next/link";
import { dmListPath } from "@/lib/platform/app-prefix";

/** DMスレッドの未検出UI（旧 /dm/not-found.tsx と同じ文言）。 */
export function DmNotFound() {
  return (
    <div className="route-state">
      <p className="route-state-code" aria-hidden="true">
        404
      </p>
      <h1 className="route-state-title">DMが見つかりません</h1>
      <p className="route-state-description">一覧から相手を選び直してください。</p>
      <Link href={dmListPath()} className="route-state-link">
        DMへ戻る
      </Link>
    </div>
  );
}

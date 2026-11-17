import Link from "next/link";
import { dmListPath } from "@/lib/platform/app-prefix";

/** サーバーチャンネルの未検出UI（`[app]/channels/not-found.tsx` から使う）。 */
export function ChannelNotFound() {
  return (
    <div className="route-state">
      <p className="route-state-code" aria-hidden="true">
        404
      </p>
      <h1 className="route-state-title">チャンネルが見つかりません</h1>
      <p className="route-state-description">URLを確認するか、一覧から選び直してください。</p>
      <Link href={dmListPath()} className="route-state-link">
        DMへ戻る
      </Link>
    </div>
  );
}

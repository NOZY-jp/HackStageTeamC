import Link from "next/link";

/** チャンネルの未検出。 */
export default function ChannelNotFound() {
  return (
    <div className="route-state">
      <p className="route-state-code" aria-hidden="true">
        404
      </p>
      <p className="route-state-title">チャンネルが見つかりません</p>
      <p className="route-state-description">サーバーの一覧から選び直してください。</p>
      <Link href="/dm" className="route-state-link">
        DMへ戻る
      </Link>
    </div>
  );
}

import Link from "next/link";

/** DMの未検出。 */
export default function DmNotFound() {
  return (
    <div className="route-state">
      <p className="route-state-code" aria-hidden="true">
        404
      </p>
      <p className="route-state-title">DMが見つかりません</p>
      <p className="route-state-description">一覧から相手を選び直してください。</p>
      <Link href="/dm" className="route-state-link">
        DMへ戻る
      </Link>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="route-state">
      <p className="route-state-code" aria-hidden="true">
        404
      </p>
      <h1 className="route-state-title">DMが見つかりません</h1>
      <p className="route-state-description">一覧から相手を選び直してください。</p>
      <Link href="/dm" className="route-state-link">
        DMへ戻る
      </Link>
    </div>
  );
}

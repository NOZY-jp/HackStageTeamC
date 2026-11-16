import Link from "next/link";

/** 未検出（(app) 配下の共通）。「無い」と「壊れた」を混ぜない。 */
export default function AppNotFound() {
  return (
    <div className="route-state">
      <p className="route-state-code" aria-hidden="true">
        404
      </p>
      <p className="route-state-title">ページが見つかりません</p>
      <p className="route-state-description">URLを確認してください。</p>
      <Link href="/dm" className="route-state-link">
        DMへ戻る
      </Link>
    </div>
  );
}

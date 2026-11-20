import Link from "next/link";

/**
 * サーバーチャンネルの未検出UI。
 * 一覧（2列目）を残したままメイン領域（3列目）に置くため `route-state--main` を付ける（#70）。
 */
export function ChannelNotFound({
  serverHref,
  backLabel = "サーバーへ戻る",
}: {
  /** 戻り先（サーバーの最初のチャンネルなど） */
  serverHref: string;
  backLabel?: string;
}) {
  return (
    <div className="route-state route-state--main">
      <p className="route-state-code" aria-hidden="true">
        404
      </p>
      <h1 className="route-state-title">チャンネルが見つかりません</h1>
      <p className="route-state-description">URLを確認するか、一覧から選び直してください。</p>
      <Link href={serverHref} className="route-state-link">
        {backLabel}
      </Link>
    </div>
  );
}

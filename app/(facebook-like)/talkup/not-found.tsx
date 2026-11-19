import Link from "next/link";

export default function FacebookNotFound() {
  return (
    <div className="max-w-[520px] mx-auto px-4 py-16">
      <div className="fb-card p-8 text-center space-y-3">
        <h1 className="text-xl font-bold">このコンテンツは利用できません</h1>
        <p className="text-sm text-[var(--fb-muted)]">
          指定された投稿またはプロフィールが見つかりませんでした。
        </p>
        <div className="pt-2">
          <Link href="/talkup" className="fb-primary-btn inline-block">
            ニュースフィードに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

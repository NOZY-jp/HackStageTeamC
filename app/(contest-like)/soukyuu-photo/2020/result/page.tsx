import type { Metadata } from "next";
import Image from "next/image";
import { ContestResultReveal } from "@/components/common/story/contest-result-reveal";
import { photoContestWork } from "@/lib/blog-like/data/contest";
import { PHOTO_CONTEST_NAME, PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: { absolute: `${PHOTO_CONTEST_NAME} 結果` },
  description: `${PHOTO_CONTEST_NAME}の結果ページ。優秀賞に「${photoContestWork.title}」が選ばれました。`,
  alternates: { canonical: canonicalUrl(PHOTO_CONTEST_RESULT_PATH) },
};

/**
 * 写真コンテストの主催者サイトの、結果発表ページ（#222）。
 * でんでんのブログとは別のサイトとして見せる（作中の URL は soukyuu-photo.jp）。
 * 受賞者の本名が載る唯一のページ（#76 段階8）。でんでんのブログなどからはリンクしない
 * （主催者サイトの中と、sitemap・検索からだけ届く）。枠（ロゴ・ナビ）は layout の ContestFrame。
 */
export default function ContestResultPage() {
  return (
    <article className="sk-article">
      <p className="sk-date">2018.12.01 お知らせ</p>
      <h1 className="sk-title">{PHOTO_CONTEST_NAME} 結果発表</h1>
      <p className="sk-lead">
        「{PHOTO_CONTEST_NAME}
        」の結果が発表されました。たくさんのご応募、ありがとうございました。
      </p>

      <section className="sk-prize" aria-labelledby="sk-prize-excellent">
        <h2 id="sk-prize-excellent" className="sk-prize-name">
          優秀賞
        </h2>
        <figure className="sk-work">
          <Image
            src={photoContestWork.src}
            alt={photoContestWork.alt}
            width={photoContestWork.width}
            height={photoContestWork.height}
            unoptimized
            className="sk-work-image"
          />
        </figure>
        <dl className="sk-meta">
          <div className="sk-meta-row">
            <dt>作品名</dt>
            <dd>「{photoContestWork.title}」</dd>
          </div>
          <div className="sk-meta-row">
            <dt>受賞者</dt>
            <dd>
              <ContestResultReveal />
            </dd>
          </div>
        </dl>
        <p className="sk-review">
          夕方のビル街で、縁石にとまる鳩と、ビルのあいだに沈む夕日を低い位置から撮った一枚です。
          足もとの小さな草花と、帰り道の静けさが選ばれました。
        </p>
      </section>

      <p className="sk-closing">受賞者のみなさま、おめでとうございます。</p>
    </article>
  );
}

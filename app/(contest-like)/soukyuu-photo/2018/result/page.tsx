import type { Metadata } from "next";
import Image from "next/image";
import { ContestResultReveal } from "@/components/common/story/contest-result-reveal";
import { PHOTO_CONTEST_NAME, PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";

export const instant = false;

export const metadata: Metadata = {
  title: { absolute: `${PHOTO_CONTEST_NAME} 結果` },
  description: `${PHOTO_CONTEST_NAME}の結果ページ。優秀賞に「帰り道」が選ばれました。`,
  alternates: { canonical: canonicalUrl(PHOTO_CONTEST_RESULT_PATH) },
};

/**
 * 写真コンテストの主催者サイトの、結果発表ページ（#222・#265）。
 * 作中の URL は soukyuu-photo.jp/2018/result。受賞者の本名が載る唯一のページ（#76 段階8）。
 * このサイトの他のページからはリンクせず、検索（sitemap）からだけ届く。
 */
export default function ContestResultPage() {
  return (
    <div className="contest-site">
      <div className="contest-result">
        <section className="contest-result-hero">
          <div className="contest-site-inner">
            <p className="contest-result-kicker">RESULTS</p>
            <h1 className="contest-result-title">{PHOTO_CONTEST_NAME} 結果発表</h1>
            <p className="contest-result-date">
              <time dateTime="2018-12-01">2018年12月1日（土）</time>
            </p>
            <p className="contest-result-lead">
              「{PHOTO_CONTEST_NAME}
              」の結果を発表します。たくさんのご応募、ありがとうございました。
            </p>
          </div>
        </section>

        <div className="contest-site-inner contest-result-body">
          <section className="contest-result-awards" aria-labelledby="contest-awards">
            <h2 id="contest-awards" className="contest-result-heading">
              受賞作品
            </h2>
            <ol className="contest-result-list">
              <li className="contest-award" data-rank="excellent">
                <figure className="contest-award-figure">
                  <Image
                    src="/blog-like/photos/contest-photo.webp"
                    alt="夕方のビル街。縁石にとまる鳩と、ビルのあいだに沈む夕日"
                    width={1200}
                    height={800}
                    unoptimized
                    className="contest-award-image"
                  />
                </figure>
                <div className="contest-award-body">
                  <p className="contest-award-rank">優秀賞</p>
                  <h3 className="contest-award-title">「帰り道」</h3>
                  <div className="contest-award-winner">
                    <ContestResultReveal />
                  </div>
                  <p className="contest-award-label">講評</p>
                  <p className="contest-award-comment">
                    夕方のビル街で、縁石にとまる鳩と、ビルのあいだに沈む夕日を低い位置から撮った一枚です。
                    足もとの小さな草花と、帰り道の静けさが選ばれました。
                  </p>
                </div>
              </li>
              <li className="contest-award" data-rank="honorable">
                <div className="contest-award-body">
                  <p className="contest-award-rank">佳作</p>
                  <h3 className="contest-award-title">「雨上がりの商店街」</h3>
                  <p className="contest-award-label">講評</p>
                  <p className="contest-award-comment">
                    濡れたアスファルトに映る看板の明かりを、低い位置からまとめた一枚。
                  </p>
                </div>
              </li>
              <li className="contest-award" data-rank="honorable">
                <div className="contest-award-body">
                  <p className="contest-award-rank">佳作</p>
                  <h3 className="contest-award-title">「窓辺の朝」</h3>
                  <p className="contest-award-label">講評</p>
                  <p className="contest-award-comment">
                    朝の光がカーテン越しに落ちるまでを、同じ位置から三枚撮って選んだ作品。
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <p className="contest-result-foot">受賞者のみなさま、おめでとうございます。</p>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ContestResultReveal } from "@/components/common/story/contest-result-reveal";
import { getBlog } from "@/lib/blog-like";
import {
  PHOTO_CONTEST_BLOG_ID,
  PHOTO_CONTEST_NAME,
  PHOTO_CONTEST_RESULT_PATH,
} from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";

export const instant = false;

type Props = PageProps<"/pochiblo/[blogId]/contest/soukyuu-photo-award-2020">;

export const metadata: Metadata = {
  title: { absolute: `${PHOTO_CONTEST_NAME} 結果` },
  description: `${PHOTO_CONTEST_NAME}の結果ページ。優秀賞に「帰り道」が選ばれました。`,
  alternates: { canonical: canonicalUrl(PHOTO_CONTEST_RESULT_PATH) },
};

/**
 * 写真コンテストの結果告知（2018年12月）。主催者側のページとして独立させ、
 * 個人ブログのヘッダー・プロフィール・カウンターは出さない（#222）。
 * 受賞者の本名は、段階7の後だけクライアント側で表示する（#76 順序7〜8）。
 */
export default async function ContestResultPage({ params }: Props) {
  const { blogId } = await params;
  const blog = getBlog(blogId);
  if (!blog || blogId !== PHOTO_CONTEST_BLOG_ID) {
    notFound();
  }

  return (
    <div className="contest-site">
      <header className="contest-site-header">
        <div className="contest-site-inner">
          <p className="contest-site-logo">
            <span className="contest-site-mark" aria-hidden="true" />
            <span className="contest-site-name">
              蒼穹フォトアワード
              <span className="contest-site-name-en">SOUKYU PHOTO AWARD</span>
            </span>
          </p>
          <p className="contest-site-organizer">主催　蒼穹フォトアワード実行委員会</p>
        </div>
      </header>

      <main className="contest-result">
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
      </main>

      <footer className="contest-site-footer">© 蒼穹フォトアワード実行委員会</footer>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { photoContestWork } from "@/lib/blog-like/data/contest";
import {
  CONTEST_GUIDELINES_PATH,
  CONTEST_SITE_NAME,
  CONTEST_SITE_PATH,
  contestSite,
} from "@/lib/contest-like/site";
import { PHOTO_CONTEST_NAME, PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: { absolute: CONTEST_SITE_NAME },
  description: `${CONTEST_SITE_NAME}の公式サイト。${PHOTO_CONTEST_NAME}の募集要項と結果発表。`,
  alternates: { canonical: canonicalUrl(CONTEST_SITE_PATH) },
};

/** 主催者サイトのトップ。お知らせとナビから結果発表・募集要項へ進める */
export default function ContestTopPage() {
  return (
    <>
      <section className="contest-hero">
        <Image
          src={photoContestWork.src}
          alt=""
          width={photoContestWork.width}
          height={photoContestWork.height}
          unoptimized
          priority
          className="contest-hero-image"
        />
        <div className="contest-site-inner contest-hero-text">
          <p className="contest-hero-kicker">{PHOTO_CONTEST_NAME}</p>
          <h1 className="contest-hero-copy">{contestSite.top.catchcopy}</h1>
          <p className="contest-hero-lead">{contestSite.top.lead}</p>
          <div className="contest-hero-actions">
            <Link href={PHOTO_CONTEST_RESULT_PATH} className="contest-button" data-primary>
              結果発表を見る
            </Link>
            <Link href={CONTEST_GUIDELINES_PATH} className="contest-button">
              募集要項
            </Link>
          </div>
        </div>
      </section>

      <div className="contest-site-inner contest-article">
        <section aria-labelledby="contest-news">
          <h2 id="contest-news" className="contest-result-heading">
            お知らせ
          </h2>
          <ul className="contest-news">
            {contestSite.news.map((item) => (
              <li key={`${item.date}-${item.title}`} className="contest-news-item">
                <time className="contest-news-date" dateTime={item.date}>
                  {item.date.replaceAll("-", ".")}
                </time>
                {"href" in item ? (
                  <Link href={item.href} className="contest-news-link">
                    {item.title}
                  </Link>
                ) : (
                  <span>{item.title}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

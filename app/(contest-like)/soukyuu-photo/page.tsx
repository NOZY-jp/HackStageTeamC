import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { photoContestWork } from "@/lib/blog-like/data/contest";
import {
  CONTEST_GUIDELINES_PATH,
  CONTEST_SITE_NAME,
  CONTEST_SITE_PATH,
  contestNews,
  contestTop,
} from "@/lib/contest-like/site";
import { PHOTO_CONTEST_NAME } from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: { absolute: CONTEST_SITE_NAME },
  description: `${CONTEST_SITE_NAME}の公式サイト。${PHOTO_CONTEST_NAME}の募集要項と結果発表。`,
  alternates: { canonical: canonicalUrl(CONTEST_SITE_PATH) },
};

/** 主催者サイトのトップ。受賞作を大きく見せ、お知らせから結果発表へ進める */
export default function ContestTopPage() {
  return (
    <>
      <section className="sk-hero">
        <Image
          src={photoContestWork.src}
          alt=""
          width={photoContestWork.width}
          height={photoContestWork.height}
          unoptimized
          priority
          className="sk-hero-image"
        />
        <div className="sk-hero-text">
          <p className="sk-hero-name">{PHOTO_CONTEST_NAME}</p>
          <h1 className="sk-hero-copy">{contestTop.catchcopy}</h1>
          <p className="sk-hero-lead">{contestTop.lead}</p>
          <div className="sk-hero-actions">
            <Link href={CONTEST_GUIDELINES_PATH} className="sk-button" data-primary>
              募集要項
            </Link>
          </div>
        </div>
      </section>

      <section className="sk-article" aria-labelledby="sk-news">
        <h2 id="sk-news" className="sk-section-title">
          お知らせ
        </h2>
        <ul className="sk-news">
          {contestNews.map((item) => (
            <li key={`${item.date}-${item.title}`} className="sk-news-item">
              <time className="sk-news-date">{item.date}</time>
              {"href" in item ? (
                <Link href={item.href} className="sk-news-link">
                  {item.title}
                </Link>
              ) : (
                <span>{item.title}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

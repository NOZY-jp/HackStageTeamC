import type { Metadata } from "next";
import { CONTEST_GUIDELINES_PATH, contestSite } from "@/lib/contest-like/site";
import { PHOTO_CONTEST_NAME } from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: { absolute: `${PHOTO_CONTEST_NAME} 募集要項` },
  description: `${PHOTO_CONTEST_NAME}の募集要項。テーマ・応募資格・応募期間・賞。`,
  alternates: { canonical: canonicalUrl(CONTEST_GUIDELINES_PATH) },
};

/** 募集要項。「結果はこのサイトで発表し、受賞者の名前と作品を載せる」と明記する（#265 案1） */
export default function ContestGuidelinesPage() {
  return (
    <article className="contest-site-inner contest-article">
      <p className="contest-article-kicker">募集は終了しました</p>
      <h1 className="contest-article-title">{PHOTO_CONTEST_NAME} 募集要項</h1>
      <dl className="contest-guidelines">
        {contestSite.guidelines.map((item) => (
          <div key={item.term} className="contest-guidelines-row">
            <dt>{item.term}</dt>
            <dd>{item.detail}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

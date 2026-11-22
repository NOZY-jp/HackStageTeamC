import type { Metadata } from "next";
import { CONTEST_GUIDELINES_PATH, contestGuidelines } from "@/lib/contest-like/site";
import { PHOTO_CONTEST_NAME } from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: { absolute: `${PHOTO_CONTEST_NAME} 募集要項` },
  description: `${PHOTO_CONTEST_NAME}の募集要項。テーマ・応募資格・応募期間・賞。`,
  alternates: { canonical: canonicalUrl(CONTEST_GUIDELINES_PATH) },
};

export default function ContestGuidelinesPage() {
  return (
    <article className="sk-article">
      <p className="sk-date">募集は終了しました</p>
      <h1 className="sk-title">{PHOTO_CONTEST_NAME} 募集要項</h1>
      <dl className="sk-guidelines">
        {contestGuidelines.map((item) => (
          <div key={item.term} className="sk-guidelines-row">
            <dt>{item.term}</dt>
            <dd>{item.detail}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

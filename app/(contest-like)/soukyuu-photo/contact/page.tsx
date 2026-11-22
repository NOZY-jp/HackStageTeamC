import type { Metadata } from "next";
import { CONTEST_CONTACT_PATH, CONTEST_SITE_NAME, contestSite } from "@/lib/contest-like/site";
import { canonicalUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: { absolute: `お問い合わせ｜${CONTEST_SITE_NAME}` },
  description: `${CONTEST_SITE_NAME}へのお問い合わせ。`,
  alternates: { canonical: canonicalUrl(CONTEST_CONTACT_PATH) },
};

export default function ContestContactPage() {
  return (
    <article className="contest-site-inner contest-article">
      <h1 className="contest-article-title">お問い合わせ</h1>
      <p className="contest-article-lead">{contestSite.contact.lead}</p>
      <p className="contest-article-lead">{contestSite.contact.note}</p>
    </article>
  );
}

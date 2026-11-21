import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogFrame } from "@/components/blog-like/blog-frame";
import { ContestResultReveal } from "@/components/common/story/contest-result-reveal";
import { StoryTrigger } from "@/components/common/story/story-trigger";
import { getBlog } from "@/lib/blog-like";
import {
  PHOTO_CONTEST_BLOG_ID,
  PHOTO_CONTEST_NAME,
  PHOTO_CONTEST_RESULT_PATH,
} from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";

// params から引くため、ブログの他ルートと同じくこの区画はブロックを許可する（#86 と同じ扱い）。
export const instant = false;

type Props = PageProps<"/pochiblo/[blogId]/contest/soukyuu-photo-award-2020">;

export const metadata: Metadata = {
  title: { absolute: `${PHOTO_CONTEST_NAME} 結果` },
  description: `${PHOTO_CONTEST_NAME}の結果ページ。優秀賞に「帰り道」が選ばれました。`,
  alternates: { canonical: canonicalUrl(PHOTO_CONTEST_RESULT_PATH) },
};

/**
 * 写真コンテストの結果告知（2018年12月・当時のブログに載せたページの再現）。
 * 受賞者の本名が載る唯一のページ。サイト内のどこからもリンクしない。
 */
export default async function ContestResultPage({ params }: Props) {
  const { blogId } = await params;
  const blog = getBlog(blogId);
  if (!blog || blogId !== PHOTO_CONTEST_BLOG_ID) {
    notFound();
  }

  return (
    <BlogFrame blog={blog}>
      <StoryTrigger flag="s08-real-name" />
      <article className="pb-entry">
        <p className="pb-entry-date">2018年12月01日（土） 10:20</p>
        <h1 className="pb-entry-title">{PHOTO_CONTEST_NAME} 結果</h1>

        <p>
          「{PHOTO_CONTEST_NAME}」の結果が発表されました。たくさんのご応募、ありがとうございました。
        </p>

        <h2>優秀賞</h2>
        <p>
          受賞者: <ContestResultReveal />
          <br />
          受賞作品: 「帰り道」
        </p>
        <p>
          夕方の川沿いで、橋の向こうに沈む夕日を撮った一枚です。川面に映るオレンジの光と、
          帰り道の静けさが選ばれました。
        </p>

        <p>受賞者のみなさま、おめでとうございます。作品は当時のブログでも紹介しています。</p>
      </article>
    </BlogFrame>
  );
}

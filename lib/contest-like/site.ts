import { PHOTO_CONTEST_NAME, PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";

/**
 * 写真コンテストの主催者サイト「蒼穹フォトアワード」（#222）の中身。
 * 作中の URL は soukyuu-photo.jp。受賞者の本名にたどり着くのは結果発表のページ（#76 段階8）。
 *
 * 文章は仮置き（台本・データ担当が書き直してよい）。書き直すときの決まり:
 * - 本名・「ゆい」「ゆっちゃん」をここに書かない（受賞者名は lib/blog-like/data/contest.ts だけ）
 * - コンテスト名は PHOTO_CONTEST_NAME を使い、表記をぶれさせない（#77）
 * - 開催は 2018 年（中3の夏休みに撮った写真。ブログの受賞記事 2018-11-17・結果発表 2018-12-01）。
 *   ブログは 2020-02 に閉鎖しているので、年を 2019 以降にしない
 */

export const CONTEST_SITE_PATH = "/soukyuu-photo";
export const CONTEST_GUIDELINES_PATH = "/soukyuu-photo/2018";
export const CONTEST_CONTACT_PATH = "/soukyuu-photo/contact";

export const CONTEST_SITE_NAME = "蒼穹フォトアワード";
export const CONTEST_ORGANIZER = "蒼穹フォトアワード実行委員会";

export const CONTEST_NAV = [
  { label: "トップ", href: CONTEST_SITE_PATH },
  { label: "募集要項", href: CONTEST_GUIDELINES_PATH },
  { label: "結果発表", href: PHOTO_CONTEST_RESULT_PATH },
  { label: "お問い合わせ", href: CONTEST_CONTACT_PATH },
] as const;

export const contestTop = {
  catchcopy: "見上げた空の、その下で。",
  lead: "空のある風景を、テーマも機材も問わず募集する写真コンテストです。スマートフォンで撮った一枚も歓迎します。",
} as const;

/** お知らせ（新しい順） */
export const contestNews = [
  { date: "2018.12.01", title: `${PHOTO_CONTEST_NAME} 結果発表`, href: PHOTO_CONTEST_RESULT_PATH },
  {
    date: "2018.10.05",
    title: "応募の受付を終了しました。たくさんのご応募、ありがとうございました。",
  },
  {
    date: "2018.07.01",
    title: `${PHOTO_CONTEST_NAME} 作品の募集を始めました`,
    href: CONTEST_GUIDELINES_PATH,
  },
] as const;

/** 募集要項（見出しと中身の組） */
export const contestGuidelines = [
  {
    term: "テーマ",
    detail: "「空のある風景」。空が少しでも写っていれば、街・海・山・身近な景色など自由です",
  },
  { term: "応募資格", detail: "どなたでも応募できます（中学生・高校生の応募も歓迎します）" },
  { term: "応募期間", detail: "7月1日〜9月30日" },
  { term: "応募方法", detail: "応募フォームから、作品名と写真を送ってください。1人3点まで" },
  { term: "機材", detail: "カメラ・スマートフォンなど問いません" },
  { term: "賞", detail: "優秀賞 1点（賞状と記念品を贈ります）" },
  {
    term: "結果発表",
    detail: "12月上旬に、このサイトで発表します。受賞者のお名前と作品を掲載します",
  },
] as const;

export const contestContact = {
  lead: `${PHOTO_CONTEST_NAME}の受付は終了しました。お問い合わせフォームも、現在は受付を停止しています。`,
  note: "次回の開催は、決まりしだいこのサイトでお知らせします。",
} as const;

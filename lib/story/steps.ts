import { PLACES } from "./places";

/**
 * 謎解きの順序。正本は GitHub Issue #76「spec: 謎解きの順序と手がかりの配分」。
 * #76 が変わったら、ここを同じ内容に直す（ここはコードから参照するための写し）。
 *
 * 各段階は「プレイヤーがそこに着いた」ことを表すフラグにもなる（StoryState.flags に入る）。
 * places は手がかりが置いてある場所（アプリ内のパス）。外部（Google 検索）なら href は無い。
 *
 * 注意: このファイルには答え（本名・黒幕の正体）を書かない。手がかりの「場所」と「中身の要約」だけ。
 */
export type Platform = "discord" | "twixer" | "blog" | "leaf" | "google" | "talkup";

export type StepPlace = {
  platform: Platform;
  /** どこにあるか（人が読む説明） */
  label: string;
  /** アプリ内のパス。外部・未作成なら無し */
  href?: string;
};

export type Step = {
  /** フラグとして使う ID（例: "s01-blog-talk"） */
  id: StepId;
  /** #76 の段階番号 */
  order: number;
  /** シナリオの章（第三章：助言 など） */
  chapter: number;
  /** その段階でプレイヤーが知ること・見つけるもの */
  summary: string;
  places: StepPlace[];
  /** その場所に手がかりがもう実装されているか（未実装なら担当Issue） */
  status: { done: true } | { done: false; issue: string };
};

export const STEP_IDS = [
  "s01-blog-talk",
  "s02-bff-reply",
  "s03-blog-found",
  "s04-old-id-screenshot",
  "s05-old-discord-user",
  "s06-old-profile-link",
  "s07-contest-entry",
  "s08-real-name",
  "s09-kai-contact",
  "s10-talkup-match",
  "s11-address",
] as const;

export type StepId = (typeof STEP_IDS)[number];

export const steps: Step[] = [
  {
    id: "s01-blog-talk",
    order: 1,
    chapter: 3,
    summary: "Discord の過去の会話で、中学生の頃にゲームの攻略ブログを書いていたと分かる",
    places: [{ platform: "discord", label: "MaiMai との DM の過去の会話（検索語: ブログ・攻略）" }],
    status: { done: true },
  },
  {
    id: "s02-bff-reply",
    order: 2,
    chapter: 3,
    summary: "Twixer で、リア友とみられる人が攻略の投稿に「○○にも書いてたよな」とリプライしている",
    places: [{ platform: "twixer", label: "リア友とみられる人物のリプライ", href: "/twitter" }],
    status: { done: false, issue: "Twixer（#76 の担当表: toki36）" },
  },
  {
    id: "s03-blog-found",
    order: 3,
    chapter: 3,
    summary:
      "ブログ名と概要で検索すると、閉鎖済みのブログ（leaf に移行しましたのお知らせだけ）が見つかる",
    places: [
      { platform: "google", label: "Seek 検索（または実在の Google 検索）", href: "/search" },
      { platform: "blog", label: "元のブログのトップ", href: "/pochiblo/denden0102" },
    ],
    status: { done: false, issue: "#77（検索で当たるようにする）" },
  },
  {
    id: "s04-old-id-screenshot",
    order: 4,
    chapter: 4,
    summary: "スクショに写るゲーマーIDが、今の Discord ID と違う（古いアカウントがある）",
    places: [{ platform: "discord", label: "DM に添付された当時のスクショ" }],
    status: { done: true },
  },
  {
    id: "s05-old-discord-user",
    order: 5,
    chapter: 4,
    summary: "古いIDと完全一致する Discord ユーザーが、ずっとオフラインのままサーバーにいる",
    places: [{ platform: "discord", label: "モンハンコミュニティのメンバー一覧" }],
    status: { done: true },
  },
  {
    id: "s06-old-profile-link",
    order: 6,
    chapter: 4,
    summary: "そのユーザーのプロフィールに、古いブログの記事一覧（トップではない）へのリンクがある",
    places: [
      { platform: "discord", label: "古いアカウントのプロフィール" },
      { platform: "blog", label: "記事一覧（マイリスト）", href: "/pochiblo/mylist/k7q2m9d4" },
    ],
    status: { done: true },
  },
  {
    id: "s07-contest-entry",
    order: 7,
    chapter: 4,
    summary: "記事一覧に、leaf に移されなかった写真コンテスト受賞の記事がある",
    places: [
      {
        platform: "blog",
        label: "写真コンテストの記事（限定公開）",
        href: "/pochiblo/denden0102/entry/e20181117",
      },
    ],
    status: { done: false, issue: "#77（コンテスト名を造語「蒼穹フォトアワード 2020」に）" },
  },
  {
    id: "s08-real-name",
    order: 8,
    chapter: 4,
    summary: "コンテスト名で検索すると本名が分かる",
    places: [
      { platform: "google", label: "Seek 検索（または実在の Google 検索）", href: "/search" },
    ],
    status: { done: false, issue: "#77" },
  },
  {
    id: "s09-kai-contact",
    order: 9,
    chapter: 5,
    summary: "カイから連絡が来て進捗を聞かれ、「本名で検索したら結構出てくるぞ？」と言われる",
    places: [{ platform: "discord", label: "χ との DM", href: PLACES["discord:dm-kai"].href }],
    status: { done: true },
  },
  {
    id: "s10-talkup-match",
    order: 10,
    chapter: 5,
    summary: "本名で talkup を検索し、BFF の写真と照合。入学式などの写真から出身地域が分かる",
    places: [{ platform: "talkup", label: "talkup の本人のプロフィール", href: "/talkup" }],
    status: { done: false, issue: "talkup（#76 の担当表: toki36）" },
  },
  {
    id: "s11-address",
    order: 11,
    chapter: 6,
    summary: "住所を特定し、「現地へ向かう」を選択する（住所そのものは作らない）",
    places: [{ platform: "talkup", label: "talkup の投稿・現地へ向かう選択", href: "/talkup" }],
    status: { done: true },
  },
];

export function getStep(id: StepId): Step | undefined {
  return steps.find((step) => step.id === id);
}

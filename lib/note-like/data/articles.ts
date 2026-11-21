import { LEAF_CREATOR_ID, migrationArticles } from "../../blog-migration/articles";
import type { Article } from "../types";

/**
 * 記事。
 * 旧ブログ（ぽちブロ）は 2020-02 に閉鎖し、限定公開記事のほとんどを leaf に移した。
 * ここにあるのはその移行記事（公開）。ゲーム画面のスクショは個人情報を含まないので公開のまま。
 * 脚本（docs/）が固まったら、物語用の記事を足していく。
 */
export const articles: Article[] = [
  {
    id: "maimai-2020-02-screenshot",
    creatorId: LEAF_CREATOR_ID,
    title: "昔のブログから、ゲーム画面を移しました",
    excerpt: "中3の頃に遊んでいたときの画面を1枚だけ。名前とIDが写っています。",
    publishedAt: "2020-02-15T20:10:00+09:00",
    tags: ["ゲーム", "モンハン", "ブログ移行"],
    likeCount: 14,
    body: [
      {
        kind: "paragraph",
        text: "ぽちブロを閉じたので、個人情報の心配がないものだけ、こちらに移しています。まずはゲーム画面を1枚。",
      },
      {
        kind: "image",
        src: "/discord-like/screenshot-2018-game.png",
        alt: "2018年の狩猟中のゲーム画面。左上にハンター名とハンターID、右上にクエスト、下にアイテムバーが並んでいる",
        width: 1200,
        height: 675,
        caption: "当時のゲーム画面。左上に出てるのが私のハンター名とハンターIDです",
        // 縮小表示だと左上のIDが読めないので、クリックで原寸（1200×675）を開けるようにする
        href: "/discord-like/screenshot-2018-game.png",
        hrefLabel: "2018年のゲーム画面を原寸で開く",
      },
      {
        kind: "paragraph",
        text: "このころは毎日オンラインで遊んでいました。装備もまだまだでしたが、それが楽しかったです。",
      },
    ],
  },
  ...migrationArticles.map<Article>(({ publishedAt, category, title, paragraphs }) => ({
    id: `migration-${publishedAt.slice(0, 10)}`,
    creatorId: LEAF_CREATOR_ID,
    title,
    excerpt: paragraphs[0],
    publishedAt,
    tags: ["モンハン", category],
    likeCount: 0,
    body: paragraphs.map((text) => ({ kind: "paragraph", text })),
  })),
];

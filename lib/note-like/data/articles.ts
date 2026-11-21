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
  {
    id: "maimai-2019-08-bow-build",
    creatorId: LEAF_CREATOR_ID,
    title: "【MHW】弓属性強化ガン積み構成まとめ",
    excerpt: "昔のブログから移した属性特化の弓装備メモです。",
    publishedAt: "2019-08-11T21:15:00+09:00",
    tags: ["モンハン", "攻略", "弓"],
    likeCount: 6,
    body: [
      {
        kind: "paragraph",
        text: "昔のブログ（でんでんの狩猟日記）で書いていた属性特化の弓装備メモをこちらに移しました。",
      },
      { kind: "heading", text: "基本の考え方" },
      {
        kind: "paragraph",
        text: "レウス2部位で「会心撃【属性】」を出しつつ、武器に合わせた属性攻撃強化を上限まで積むのがいちばん火力が伸びます。見切りと弱点特効で会心率を上げておくと、剛射のダメージがかなり変わります。",
      },
      { kind: "heading", text: "スタミナ管理" },
      {
        kind: "paragraph",
        text: "体術をLv3まで積んでおけば、強走薬やネコの体術と合わせてステップをずっと回せます。枠がかつかつのときは、攻撃系より先に体術を残したほうが立ち回りやすいです。",
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

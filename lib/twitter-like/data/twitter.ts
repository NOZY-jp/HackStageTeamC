import { HAL_HANDLE } from "@/lib/discord-like/data/names";
import type { Post, Profile, Trend, TwitterUser } from "../types";

/**
 * Twitter-like SNS 用のダミーデータ。
 * User.id は Discord 側（u1〜u5）と衝突しないよう "tw-" で始める。
 * handle は URL に入るため英小文字 / 数字 / ハイフンのみ・全体で一意。
 * 日時は 2026-11 固定（JST）。劇中世界の投稿のみ（開発用語は入れない）。
 */
export const twitterUsers: TwitterUser[] = [
  { id: "tw-hal", displayName: "Hal", handle: HAL_HANDLE, avatarColor: "#3b6fd4" },
  { id: "tw-mai", displayName: "Mai", handle: "mai2mai2", avatarColor: "#c2417c" },
  { id: "tw-sou", displayName: "ソウ", handle: "kaiser018023071", avatarColor: "#b86a1f" },
  { id: "tw-kanon", displayName: "かのん", handle: "kanon__dayo", avatarColor: "#c2563f" },
  // まいのリア友とみられる人物（post-102 の返信者）。名前は #76 未確定。表示名・handle は仮決め
  { id: "tw-tomo", displayName: "とも", handle: "tomo-0718", avatarColor: "#4e8a5c" },
  // 古いアカウント。改名して鍵垢になった（旧 @hunter_denden0102 → 現 @maimai_mhw）
  {
    id: "tw-old-denden",
    displayName: "まいまい",
    handle: "maimai_mhw",
    avatarColor: "#7a6a3f",
    protected: true,
  },
];

export const twitterProfiles: Profile[] = [
  {
    userId: "tw-hal",
    bio: "ネトゲで出会った人と1年半。今週末、はじめて会いに行く。",
    joinedAt: "2026-11-01",
    followingCount: 84,
    followersCount: 112,
  },
  {
    userId: "tw-mai",
    bio: "ゲームでは mai。顔も名前も教えてない人がいるけど、それでいいと思ってる。",
    // 2019年の投稿（post-101 など）より前から使っているアカウント
    joinedAt: "2019-05-12",
    followingCount: 96,
    followersCount: 141,
  },
  {
    userId: "tw-sou",
    bio: "ネトゲ歴は長いほう。相談にはだいたい乗る。",
    joinedAt: "2026-11-02",
    followingCount: 58,
    followersCount: 77,
  },
  {
    // 記事の名前で検索すると見つかる（bio に記事名を残している）。
    // 改名したことと旧ハンドル・旧表示名を bio に残す（今は誰も使っていない）
    userId: "tw-old-denden",
    bio: "前は @hunter_denden0102（hunter_denden って名前だった）。「写真コンテストで賞をもらいました！」書いた人。BFF: @kanon__dayo",
    // 旧ブログの最古記事（2018-01-27）より前から使っているアカウント
    joinedAt: "2017-12-01",
    followingCount: 38,
    followersCount: 64,
  },
  {
    userId: "tw-kanon",
    bio: "写真を撮るのが好き。古い友達とよく出かけてます。",
    joinedAt: "2017-11-20",
    followingCount: 120,
    followersCount: 98,
  },
  {
    // プロフィール画面が profile を必須にするので最小だけ置く
    userId: "tw-tomo",
    bio: "たわごと。",
    joinedAt: "2019-03-21",
    followingCount: 42,
    followersCount: 35,
  },
];

/**
 * フォロー関係（見る側の user id → フォローしている user id の一覧）。
 * ホームのタイムラインとおすすめユーザーの母集団に使う。
 * リョウ（tw-hal）がこの SNS で知っているのはゲーム仲間の Mai とソウだけ。
 * かのんも、まいのリア友とみられる人物もまだ知らないのでフォローしていない
 * — かのんは旧アカウントの bio の「BFF: @kanon__dayo」から見つけるのが筋書き。
 */
export const twitterFollows: Record<string, string[]> = {
  "tw-hal": ["tw-mai", "tw-sou"],
};

export const twitterPosts: Post[] = [
  {
    id: "post-002",
    authorId: "tw-hal",
    postedAt: "2026-11-02T10:15:00+09:00",
    body: "例のゲームを始めて、今日でちょうど1年半。最初はフィールドから出られない新規だった。",
    replyCount: 4,
    repostCount: 21,
    likeCount: 96,
  },
  {
    id: "post-003",
    authorId: "tw-mai",
    postedAt: "2026-11-03T23:40:00+09:00",
    body: "はじめて話したのは夜のフィールド。道に迷ってた私を、何十分も案内してくれた人がいた。",
    replyCount: 2,
    repostCount: 15,
    likeCount: 58,
  },
  {
    id: "post-004",
    authorId: "tw-hal",
    postedAt: "2026-11-03T23:55:00+09:00",
    body: "@mai2mai2 その人、いまも毎日インしてるらしい。",
    replyToId: "post-003",
    replyCount: 1,
    repostCount: 0,
    likeCount: 41,
  },
  {
    id: "post-005",
    authorId: "tw-mai",
    postedAt: "2026-11-04T00:10:00+09:00",
    body: "@kohakunchos0117 らしいね。",
    replyToId: "post-004",
    replyCount: 0,
    repostCount: 0,
    likeCount: 29,
  },
  {
    id: "post-008",
    authorId: "tw-mai",
    postedAt: "2026-11-06T09:25:00+09:00",
    body: "休日の朝から仕事の電話。今週こそは休ませてほしい。",
    replyCount: 6,
    repostCount: 4,
    likeCount: 38,
  },
  {
    id: "post-010",
    authorId: "tw-hal",
    postedAt: "2026-11-08T22:00:00+09:00",
    body: "平日はインできない日が続いた。週末は必ずログインする。約束だから。",
    replyCount: 1,
    repostCount: 9,
    likeCount: 74,
  },
  {
    id: "post-011",
    authorId: "tw-mai",
    postedAt: "2026-11-08T22:30:00+09:00",
    body: "@kohakunchos0117 待ってる。無理しないでね。",
    replyToId: "post-010",
    replyCount: 0,
    repostCount: 0,
    likeCount: 33,
  },
  {
    id: "post-013",
    authorId: "tw-sou",
    postedAt: "2026-11-11T20:45:00+09:00",
    body: "新規が迷子になってるのを見ると、つい拾いたくなる。昔の自分を見てるみたいで。",
    replyCount: 2,
    repostCount: 5,
    likeCount: 24,
  },
  {
    id: "post-014",
    authorId: "tw-hal",
    postedAt: "2026-11-12T21:10:00+09:00",
    body: "決まった。来週末、1年半越しにはじめて会う。顔も名前も知らないままの、1年半。",
    replyCount: 9,
    repostCount: 25,
    likeCount: 168,
  },
  {
    id: "post-015",
    authorId: "tw-sou",
    postedAt: "2026-11-12T21:40:00+09:00",
    body: "@kohakunchos0117 お、ついにか。服装は相手が見つけやすいよう目立つ色にしとけ。あと最初の一声は決めておくと安心だ。",
    replyToId: "post-014",
    replyCount: 1,
    repostCount: 0,
    likeCount: 19,
  },
  {
    id: "post-016",
    authorId: "tw-hal",
    postedAt: "2026-11-13T19:05:00+09:00",
    body: "相談したら、初対面でかける言葉まで考えてくれた。「これなら絶対に伝わる」って。頼りになる人だ。",
    replyCount: 1,
    repostCount: 3,
    likeCount: 52,
  },
  {
    id: "post-018",
    authorId: "tw-mai",
    postedAt: "2026-11-14T08:40:00+09:00",
    body: "朝までみんなとレイドしてしまった。今日は眠い。",
    replyCount: 2,
    repostCount: 1,
    likeCount: 22,
  },
  {
    id: "post-019",
    authorId: "tw-mai",
    postedAt: "2026-11-15T23:12:00+09:00",
    body: "きのうから、知ってるはずのない言い回しを目にする。たぶん偶然。そう思うことにする。",
    replyCount: 0,
    repostCount: 4,
    likeCount: 21,
  },
  {
    id: "post-020",
    authorId: "tw-sou",
    postedAt: "2026-11-15T22:05:00+09:00",
    body: "@kohakunchos0117 教えた言い回し、試したか？きっと効くから。",
    replyToId: "post-016",
    replyCount: 0,
    repostCount: 0,
    likeCount: 9,
  },
  {
    id: "post-021",
    authorId: "tw-hal",
    postedAt: "2026-11-16T19:30:00+09:00",
    body: "当日の服はもう決めた。相手が見つけやすいように、色だけ先に伝えてある。",
    replyCount: 1,
    repostCount: 2,
    likeCount: 47,
  },
  {
    id: "post-022",
    authorId: "tw-mai",
    postedAt: "2026-11-16T20:02:00+09:00",
    body: "@kohakunchos0117 ……うん。楽しみだね。",
    replyToId: "post-021",
    replyCount: 0,
    repostCount: 0,
    likeCount: 11,
  },
  {
    id: "post-023",
    authorId: "tw-hal",
    postedAt: "2026-11-17T08:05:00+09:00",
    body: "あと4日。緊張して、夜ちゃんと眠れなくなってきた。",
    replyCount: 2,
    repostCount: 6,
    likeCount: 83,
  },
  // 2019年の攻略投稿と、リア友とみられる人物の「前のブログで書いてた…」リプライ。
  // ブログ名そのものは書かず、記事タイトルのヒント（「弓属性強化ガン積み構成」）を出す
  {
    id: "post-101",
    authorId: "tw-mai",
    postedAt: "2019-09-08T22:10:00+09:00",
    body: "弓の属性装備、スキル枠がかつかつでどれ削るか悩む…",
    replyCount: 1,
    repostCount: 0,
    likeCount: 12,
  },
  {
    id: "post-102",
    authorId: "tw-tomo",
    postedAt: "2019-09-09T21:40:00+09:00",
    body: "この立ち回り、まいまいが前のブログで書いてた弓属性強化ガン積み構成のやつより楽じゃない？",
    replyToId: "post-101",
    replyCount: 0,
    repostCount: 0,
    likeCount: 3,
  },
  // かのんの写真つき投稿（第五章の照合用。名前は書かない）
  {
    id: "post-103",
    authorId: "tw-kanon",
    postedAt: "2026-11-10T19:05:00+09:00",
    body: "高校のときの。この子とはいつも一緒だった。",
    replyCount: 0,
    repostCount: 1,
    likeCount: 28,
    media: [
      {
        src: "/twitter-like/photo-01.svg",
        alt: "制服姿で並ぶ二人。左の子は黒髪のボブ",
        width: 800,
        height: 600,
      },
      {
        src: "/twitter-like/photo-02.svg",
        alt: "テーブルをはさんで笑う二人。手前の子は茶髪のロング",
        width: 800,
        height: 600,
      },
    ],
  },
  {
    id: "post-104",
    authorId: "tw-kanon",
    postedAt: "2026-11-14T08:30:00+09:00",
    body: "アルバムを整理してたら出てきた。また会いたいな。",
    replyCount: 0,
    repostCount: 0,
    likeCount: 19,
    media: [
      {
        src: "/twitter-like/photo-03.svg",
        alt: "古いアルバムから。並んで笑う二人。左は黒髪のボブ、右は茶髪のロング",
        width: 800,
        height: 600,
      },
    ],
  },
  // 旧アカウント（@maimai_mhw・鍵垢）の残存投稿。ブログを書いていた頃〜閉鎖まで。
  // 鍵垢なので公開面には出ない（プロフィールの件数表示だけに数が残る）
  {
    id: "post-201",
    authorId: "tw-old-denden",
    postedAt: "2018-01-27T21:14:00+09:00",
    body: "モンスターハンターワールド、はじめた。武器は双剣にした。",
    replyCount: 1,
    repostCount: 0,
    likeCount: 4,
  },
  {
    id: "post-202",
    authorId: "tw-old-denden",
    postedAt: "2018-01-27T21:20:00+09:00",
    body: "あわせてブログもはじめてみた。続くといいな。",
    replyToId: "post-201",
    replyCount: 0,
    repostCount: 0,
    likeCount: 2,
  },
  {
    id: "post-203",
    authorId: "tw-old-denden",
    postedAt: "2020-02-14T22:30:00+09:00",
    body: "ブログは note に移行した。こっちのアカウントはもう更新しないかも。",
    replyCount: 0,
    repostCount: 0,
    likeCount: 1,
  },
];

/** ポストの表示数（インプレッション）のダミー値。Post.id → 件数。 */
export const twitterViewCounts: Record<string, number> = {
  "post-002": 2400,
  "post-003": 1980,
  "post-004": 1210,
  "post-005": 1150,
  "post-008": 1320,
  "post-010": 1560,
  "post-011": 1040,
  "post-013": 910,
  "post-014": 3100,
  "post-015": 980,
  "post-016": 1450,
  "post-018": 640,
  "post-019": 560,
  "post-020": 430,
  "post-021": 1120,
  "post-022": 460,
  "post-023": 1690,
  "post-101": 180,
  "post-102": 240,
  "post-103": 96,
  "post-104": 55,
  "post-201": 40,
  "post-202": 22,
  "post-203": 18,
};

// トレンドを押すと名前のまま検索される。着弾先はリョウのゲーム仲間（Hal・Mai・ソウ）の
// 雑談だけに絞る — 手がかりの投稿（post-101/102）やかのん・旧アカウントに直行する名前は置かない。
// ポスト件数は出さない — 実際の検索結果（各1〜2件）と食い違う数字を見せないため。
export const twitterTrends: Trend[] = [
  { id: "trend-1", category: "ゲーム · トレンド", name: "例のゲーム" },
  { id: "trend-2", category: "ゲーム · トレンド", name: "レイド" },
  { id: "trend-3", category: "ゲーム · トレンド", name: "迷子" },
  { id: "trend-4", category: "トレンド", name: "週末" },
  { id: "trend-5", category: "トレンド", name: "電話" },
];

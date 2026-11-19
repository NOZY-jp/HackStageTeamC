import type { Blog, Entry, Mylist } from "../types";
import { LEAF_CREATOR_ID, LEAF_HOST, OLD_TWIXER_HANDLE } from "./names";

/**
 * 彼女（ゆい、2003-01-02 生まれ）が中高生のころ書いていた元のブログ「でんでんの狩猟日記」。
 * 2018-01（MHW 発売直後、中3）〜 2020-02（閉鎖のお知らせ）。
 *
 * 「閉鎖」の形: 閉鎖のお知らせだけを公開のまま残し、それ以外の記事はすべて限定公開にした。
 * トップからは閉鎖のお知らせしか見えないが、マイリスト（古い Discord アカウントのプロフィールからリンク）に
 * 全記事が残っていて、note（leaf）に移さなかった記事も読める。
 *
 * 中高生の文体で書く。ゲームの時期は実際の発売に合わせる（MHW 2018-01-26、アイスボーン 2019-09-06）。
 * 昔の呼び方（シナリオの鍵）と本名は、ここには書かない（テストで確認）。
 */
export const blogs: Blog[] = [
  {
    id: "denden0102",
    title: "でんでんの狩猟日記",
    description: "モンハン大好き中学生の攻略メモと日記です！",
    authorName: "でんでん",
    authorProfile:
      "モンハン歴3年（3DSから）。ワールドは双剣メイン、たまにライトボウガン。のんびり更新です。",
    avatar: "/blog-like/avatars/denden.svg",
    visitorCount: 18342,
  },
];

const twixerStatus = (statusId: string): string =>
  `twixer.com/${OLD_TWIXER_HANDLE}/status/${statusId}`;

const twixerLink = (statusId: string) =>
  ({ kind: "link", lead: "Twixerにも投稿しました！", url: twixerStatus(statusId) }) as const;

export const entries: Entry[] = [
  {
    id: "e20180127",
    blogId: "denden0102",
    title: "ブログはじめました！",
    category: "日記",
    publishedAt: "2018-01-27T21:30:00+09:00",
    commentCount: 3,
    visibility: "unlisted",
    body: [
      { kind: "paragraph", text: "はじめまして、でんでんです！ 中3です。" },
      {
        kind: "paragraph",
        text: "小学生のときに3DSのモンハンにハマって、昨日発売のワールドを買ってもらいました！！ グラフィックがすごすぎて、古代樹の森を歩いてるだけで1時間たってました笑",
      },
      {
        kind: "paragraph",
        text: "高校受験がもうすぐなので、受験が終わるまでは1日30分の約束です。攻略とか、日記とかを書いていこうと思います。よろしくお願いします！",
      },
      twixerLink("957104265840128001"),
    ],
  },
  {
    id: "e20180303",
    blogId: "denden0102",
    title: "高校、合格しました！！",
    category: "日記",
    publishedAt: "2018-03-03T18:20:00+09:00",
    commentCount: 6,
    visibility: "unlisted",
    body: [
      { kind: "paragraph", text: "第一志望の高校に合格しました！！ 本当によかった…" },
      {
        kind: "paragraph",
        text: "いちばん仲のいい友達も同じ高校に受かってて、2人で泣きました。今日から1日30分の約束は終わりです笑",
      },
    ],
  },
  {
    id: "e20180310",
    blogId: "denden0102",
    title: "【MHW】双剣、下位でおすすめの装備",
    category: "攻略",
    publishedAt: "2018-03-10T16:10:00+09:00",
    commentCount: 5,
    visibility: "unlisted",
    body: [
      {
        kind: "paragraph",
        text: "受験が終わったので、やっとちゃんと攻略が書けます！ 下位のうちに双剣で使いやすかった装備をまとめます。",
      },
      { kind: "heading", text: "武器" },
      {
        kind: "paragraph",
        text: "ボーン系を強化していくのが楽です。素材が集めやすいので、とりあえずこれでストーリーは進められます。",
      },
      { kind: "heading", text: "防具" },
      {
        kind: "paragraph",
        text: "体術が付く防具があると、鬼人化してもスタミナが切れにくくなるのでおすすめです。見た目はちょっと変になるけど気にしない笑",
      },
      twixerLink("972419204557742080"),
    ],
  },
  {
    id: "e20180316",
    blogId: "denden0102",
    title: "卒業しました！",
    category: "日記",
    publishedAt: "2018-03-16T19:40:00+09:00",
    commentCount: 8,
    visibility: "unlisted",
    body: [
      { kind: "paragraph", text: "中学校を卒業しました！" },
      {
        kind: "paragraph",
        text: "いちばん仲のいい友達と写真を撮ってもらいました。高校も同じなので、これからもずっと一緒に狩りに行けます！",
      },
      {
        kind: "image",
        src: "/blog-like/photos/graduation.svg",
        alt: "中学校の卒業式の看板の前で、制服姿の2人が並んで立っている。右の子が卒業証書を広げて持っている",
        width: 1200,
        height: 800,
        caption: "右が私です笑",
      },
    ],
  },
  {
    id: "e20180325",
    blogId: "denden0102",
    title: "ネルギガンテに勝てない",
    category: "日記",
    publishedAt: "2018-03-25T22:45:00+09:00",
    commentCount: 2,
    visibility: "unlisted",
    body: [
      {
        kind: "paragraph",
        text: "ネルギガンテに5回負けました。トゲが黒くなったら逃げる、を覚えた。",
      },
      { kind: "paragraph", text: "春休みなので明日もやります。おやすみなさい。" },
    ],
  },
  {
    id: "e20180421",
    blogId: "denden0102",
    title: "【MHW】歴戦の個体ってなに？ まとめてみた",
    category: "攻略",
    publishedAt: "2018-04-21T15:20:00+09:00",
    commentCount: 4,
    visibility: "unlisted",
    body: [
      {
        kind: "paragraph",
        text: "高校のクラスの子に「歴戦ってなに？」と聞かれて、うまく説明できなかったのでまとめます！",
      },
      {
        kind: "paragraph",
        text: "歴戦の個体は、普通のモンスターより強いかわりに、いい素材や装飾品が出やすいモンスターです。痕跡を集めると調査クエストとして出てきます。",
      },
      twixerLink("987857322164854784"),
    ],
  },
  {
    id: "e20180811",
    blogId: "denden0102",
    title: "夏休み、友達とずっとマルチしてる",
    category: "日記",
    publishedAt: "2018-08-11T23:05:00+09:00",
    commentCount: 1,
    visibility: "unlisted",
    body: [
      {
        kind: "paragraph",
        text: "中学からの友達がワールドを始めたので、夏休みは毎日マルチしてます！",
      },
      {
        kind: "paragraph",
        text: "友達はハンマーで、私が双剣。私が尻尾を狙って、友達が頭をなぐる担当です。最強コンビ（たぶん）",
      },
    ],
  },
  {
    id: "e20181117",
    blogId: "denden0102",
    title: "写真コンテストで賞をもらいました！",
    category: "日記",
    publishedAt: "2018-11-17T20:10:00+09:00",
    commentCount: 9,
    visibility: "unlisted",
    body: [
      {
        kind: "paragraph",
        text: "今日はモンハンの話じゃないです。夏休みに撮った写真を「第9回 わかば高校生フォトコンテスト」に出したら、優秀賞をもらいました！！",
      },
      {
        kind: "paragraph",
        text: "スマホで撮った写真なのに、表彰式でちゃんと名前を呼ばれて、すごく緊張しました。結果のページにも名前が載ってて、家族にめっちゃ見せびらかされてます笑",
      },
      {
        kind: "image",
        src: "/blog-like/photos/contest-photo.svg",
        alt: "夕方の川沿い。橋の向こうに沈む夕日と、川面に映るオレンジの光",
        width: 1200,
        height: 800,
        caption: "賞をもらった写真です。タイトルは「帰り道」",
      },
      {
        kind: "paragraph",
        text: "ゲームの景色を撮るのが好きで、現実でもやってみたら楽しかったです。また何か出してみたい！",
      },
    ],
  },
  {
    id: "e20181231",
    blogId: "denden0102",
    title: "2018年の狩猟まとめ",
    category: "日記",
    publishedAt: "2018-12-31T22:05:00+09:00",
    commentCount: 3,
    visibility: "unlisted",
    body: [
      {
        kind: "paragraph",
        text: "今年はワールドが出て、ブログを始めて、高校生になった一年でした。",
      },
      {
        kind: "paragraph",
        text: "いちばん好きなモンスターはネルギガンテ。最初は5回負けたのに、最後は双剣でいちばん楽しく戦える相手になりました。来年もよろしくお願いします！",
      },
    ],
  },
  {
    id: "e20190406",
    blogId: "denden0102",
    title: "高2になりました",
    category: "日記",
    publishedAt: "2019-04-06T21:15:00+09:00",
    commentCount: 2,
    visibility: "unlisted",
    body: [
      {
        kind: "paragraph",
        text: "高2になりました。友達とはクラスが分かれちゃったけど、夜はいつも通りマルチしてます。",
      },
      {
        kind: "paragraph",
        text: "秋にワールドの大型の追加コンテンツが出るらしいので、それまでに装備を整えておきます！",
      },
    ],
  },
  {
    id: "e20190907",
    blogId: "denden0102",
    title: "アイスボーン発売！ 初日の感想",
    category: "日記",
    publishedAt: "2019-09-07T00:40:00+09:00",
    commentCount: 3,
    visibility: "unlisted",
    body: [
      {
        kind: "paragraph",
        text: "アイスボーン、発売日にダウンロードしました！ 新しいフィールドが寒そうで最高です。",
      },
      {
        kind: "paragraph",
        text: "クラッチクローが楽しすぎて、ずっとモンスターにしがみついてます。攻略記事はもう少し進んでから書きます！",
      },
      twixerLink("1170047611245301760"),
    ],
  },
  {
    id: "e20191215",
    blogId: "denden0102",
    title: "【MHWI】双剣の装飾品、最初にこれだけ付けておけばいい",
    category: "攻略",
    publishedAt: "2019-12-15T17:30:00+09:00",
    commentCount: 7,
    visibility: "unlisted",
    body: [
      {
        kind: "paragraph",
        text: "いちばん質問が多かった双剣の装飾品の話です。装飾品が全然出ない人向けに、優先順位だけまとめました。",
      },
      { kind: "paragraph", text: "1. 攻撃と見切り（まず会心率を上げる）" },
      { kind: "paragraph", text: "2. 体術（鬼人化中のスタミナ対策）" },
      { kind: "paragraph", text: "3. 属性強化（属性双剣を使う場合）" },
      twixerLink("1206126718894268416"),
    ],
  },
  {
    id: "e20200211",
    blogId: "denden0102",
    title: "ブログ閉鎖のお知らせ",
    category: "お知らせ",
    publishedAt: "2020-02-11T20:30:00+09:00",
    commentCount: 11,
    visibility: "public",
    body: [
      {
        kind: "paragraph",
        text: "このブログは今日で閉鎖します。中3から2年間、読んでくれた人、コメントをくれた人、本当にありがとうございました。",
      },
      { kind: "paragraph", text: "これからは leaf で書きます。記事は少しずつ向こうに移しました。" },
      { kind: "link", lead: "新しい場所はこちら", url: `${LEAF_HOST}/${LEAF_CREATOR_ID}` },
    ],
  },
];

/** 全記事を入れたマイリスト（古い Discord アカウントのプロフィールからリンクされる）。古い順。 */
export const mylists: Mylist[] = [
  {
    id: "k7q2m9d4",
    blogId: "denden0102",
    title: "でんでんの狩猟日記 ぜんぶ",
    entryIds: entries
      .toSorted((a, b) => a.publishedAt.localeCompare(b.publishedAt))
      .map((entry) => entry.id),
  },
];

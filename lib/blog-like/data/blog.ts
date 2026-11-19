import type { Blog, Entry } from "../types";
import { LEAF_CREATOR_ID, LEAF_HOST, OLD_TWIXER_HANDLE } from "./names";

/**
 * 彼女（ゆい）が中学生のころ書いていた元のブログ。2018-01（MHW 発売直後、中2）〜 2020-02（閉鎖のお知らせ）。
 * 「閉鎖」は個人ブログでよくある形で、更新を止めてお知らせを置いただけ。過去の記事は今も公開されたまま。
 * leaf（shiro_hunt）の「ブログ引っ越しました」（2020-02-11）と日付を揃えている。
 * 中学生の文体で書く。ゲームの時期は実際の発売に合わせる（MHW 2018-01-26、アイスボーン 2019-09-06）。
 * 「ゆっちゃん」（昔の呼び方、シナリオの鍵）は過去のストーカーだけが知る愛称なので、ここには書かない。
 */
export const blogs: Blog[] = [
  {
    id: "shirokari",
    title: "しろの狩猟記録",
    description: "モンハン大好き中学生の攻略メモと日記です！（更新は終了しました）",
    authorName: "しろ",
    authorProfile:
      "モンハン歴3年（3DSから）。ワールドは双剣メイン、たまにライトボウガン。中学生なので更新はゆっくりです。",
    avatar: "/blog-like/avatars/shiro.svg",
    visitorCount: 18342,
  },
];

const twixerStatus = (statusId: string): string =>
  `twixer.com/${OLD_TWIXER_HANDLE}/status/${statusId}`;

export const entries: Entry[] = [
  {
    id: "e20180127",
    blogId: "shirokari",
    title: "ブログはじめました！",
    category: "日記",
    publishedAt: "2018-01-27T21:30:00+09:00",
    commentCount: 3,
    body: [
      { kind: "paragraph", text: "はじめまして、しろです！ 中2です。" },
      {
        kind: "paragraph",
        text: "小学生のときに3DSのモンハンにハマって、昨日発売のワールドを買ってもらいました！！ グラフィックがすごすぎて、古代樹の森を歩いてるだけで1時間たってました笑",
      },
      {
        kind: "paragraph",
        text: "攻略とか、自分用のメモとか、日記とかを書いていこうと思います。よろしくお願いします！",
      },
      { kind: "link", lead: "Twixerにも投稿しました！", url: twixerStatus("957104265840128001") },
    ],
  },
  {
    id: "e20180204",
    blogId: "shirokari",
    title: "【MHW】双剣、下位でおすすめの装備",
    category: "攻略",
    publishedAt: "2018-02-04T16:10:00+09:00",
    commentCount: 5,
    body: [
      {
        kind: "paragraph",
        text: "下位のうちに双剣で使いやすかった装備をまとめます！ まだ上位に行ったばかりなので、間違ってたらコメントで教えてください。",
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
      { kind: "link", lead: "Twixerにも投稿しました！", url: twixerStatus("960098537711493120") },
    ],
  },
  {
    id: "e20180218",
    blogId: "shirokari",
    title: "ネルギガンテに勝てない",
    category: "日記",
    publishedAt: "2018-02-18T22:45:00+09:00",
    commentCount: 2,
    body: [
      {
        kind: "paragraph",
        text: "ネルギガンテに5回負けました。トゲが黒くなったら逃げる、を覚えた。",
      },
      { kind: "paragraph", text: "明日学校なので寝ます。おやすみなさい。" },
    ],
  },
  {
    id: "e20180325",
    blogId: "shirokari",
    title: "【MHW】歴戦の個体ってなに？ 中学生なりにまとめてみた",
    category: "攻略",
    publishedAt: "2018-03-25T15:20:00+09:00",
    commentCount: 4,
    body: [
      {
        kind: "paragraph",
        text: "クラスの友達に「歴戦ってなに？」と聞かれて、うまく説明できなかったのでまとめます！",
      },
      {
        kind: "paragraph",
        text: "歴戦の個体は、普通のモンスターより強いかわりに、いい素材や装飾品が出やすいモンスターです。痕跡を集めると調査クエストとして出てきます。",
      },
      {
        kind: "paragraph",
        text: "春休みなので、しばらくは毎日歴戦マラソンします！",
      },
      { kind: "link", lead: "Twixerにも投稿しました！", url: twixerStatus("977807218863697920") },
    ],
  },
  {
    id: "e20180811",
    blogId: "shirokari",
    title: "夏休み、友達とずっとマルチしてる",
    category: "日記",
    publishedAt: "2018-08-11T23:05:00+09:00",
    commentCount: 1,
    body: [
      {
        kind: "paragraph",
        text: "同じクラスの友達がワールドを始めたので、夏休みは毎日マルチしてます！",
      },
      {
        kind: "paragraph",
        text: "友達はハンマーで、私が双剣。私が尻尾を狙って、友達が頭をなぐる担当です。最強コンビ（たぶん）",
      },
      {
        kind: "paragraph",
        text: "受験生なので本当は勉強しないといけないけど、夏休みのあいだだけ…！",
      },
    ],
  },
  {
    id: "e20181208",
    blogId: "shirokari",
    title: "受験生なので、更新ペースを落とします",
    category: "お知らせ",
    publishedAt: "2018-12-08T20:00:00+09:00",
    commentCount: 6,
    body: [
      {
        kind: "paragraph",
        text: "高校受験が近いので、しばらく更新をお休みします。ゲームも1日30分にしました（守れてない）。",
      },
      {
        kind: "paragraph",
        text: "合格したら、また攻略を書きます！ コメントくれる人、いつもありがとうございます。",
      },
    ],
  },
  {
    id: "e20190316",
    blogId: "shirokari",
    title: "卒業しました！",
    category: "日記",
    publishedAt: "2019-03-16T19:40:00+09:00",
    commentCount: 8,
    body: [
      { kind: "paragraph", text: "中学校を卒業しました！ 高校も無事に合格しました！！" },
      {
        kind: "paragraph",
        text: "いちばん仲のいい友達と写真を撮ってもらいました。夏休みにずっとマルチしてた子です。高校は別々だけど、これからもずっと一緒に狩りに行く約束をしました。",
      },
      {
        kind: "image",
        src: "/blog-like/photos/graduation.svg",
        alt: "中学校の卒業式の看板の前で、制服姿の2人が並んで立っている。右の子が卒業証書を広げて持っている",
        width: 1200,
        height: 800,
        caption: "右が私です笑",
      },
      { kind: "paragraph", text: "春休みはひさしぶりにモンハンします！" },
    ],
  },
  {
    id: "e20190406",
    blogId: "shirokari",
    title: "高校生になりました",
    category: "日記",
    publishedAt: "2019-04-06T21:15:00+09:00",
    commentCount: 2,
    body: [
      {
        kind: "paragraph",
        text: "高校生になりました。電車通学になったので、移動中にスマホで攻略記事を書いています。",
      },
      {
        kind: "paragraph",
        text: "秋にワールドの大型の追加コンテンツが出るらしいので、それまでに装備を整えておきます！",
      },
    ],
  },
  {
    id: "e20190907",
    blogId: "shirokari",
    title: "アイスボーン発売！ 初日の感想",
    category: "日記",
    publishedAt: "2019-09-07T00:40:00+09:00",
    commentCount: 3,
    body: [
      {
        kind: "paragraph",
        text: "アイスボーン、発売日にダウンロードしました！ 新しいフィールドが寒そうで最高です。",
      },
      {
        kind: "paragraph",
        text: "クラッチクローが楽しすぎて、ずっとモンスターにしがみついてます。攻略記事はもう少し進んでから書きます！",
      },
      { kind: "link", lead: "Twixerにも投稿しました！", url: twixerStatus("1170047611245301760") },
    ],
  },
  {
    id: "e20200211",
    blogId: "shirokari",
    title: "ブログ閉鎖のお知らせ",
    category: "お知らせ",
    publishedAt: "2020-02-11T20:30:00+09:00",
    commentCount: 11,
    body: [
      {
        kind: "paragraph",
        text: "このブログは今日で更新を終わりにします。中2から2年間、読んでくれた人、コメントをくれた人、本当にありがとうございました。",
      },
      {
        kind: "paragraph",
        text: "広告が多くなってきたのと、昔の記事が恥ずかしくなってきたので、新しい場所で書き直すことにしました。攻略記事は少しずつ向こうに移します。ここの記事は、しばらくこのまま置いておきます。",
      },
      { kind: "link", lead: "これからはこちらで書きます", url: `${LEAF_HOST}/${LEAF_CREATOR_ID}` },
    ],
  },
];

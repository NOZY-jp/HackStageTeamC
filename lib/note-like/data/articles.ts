import type { Article } from "../types";

/**
 * 記事。作品世界（Google Docs「HackStageTeamC」のシナリオ）に合わせたダミーデータ。
 *
 * shiro_hunt（彼女の高校生のころのアカウント）は、元のブログを閉じて引っ越してきた 2020 年から、
 * 受験で更新を止める 2021 年春までの記事だけを持つ。ゲームの時期は実際の発売・配信に合わせている
 * （MHW: アイスボーン 2019〜2020 年、モンハンライズ 2021 年 3 月 26 日発売、ワイルズ 2025 年 2 月 28 日発売）。
 * 時刻はすべて日本時間で、現在（2026-11-19）より前。
 */
export const articles: Article[] = [
  // ---- しろ（shiro_hunt）: 2020-02 〜 2021-04 ----
  {
    id: "n0a1c8e2f4b71",
    creatorId: "shiro_hunt",
    title: "ブログ引っ越しました",
    excerpt: "2018年から書いていた「しろの狩猟記録」を閉じて、こっちで続けることにしました。",
    cover: "/note-like/covers/moving-boxes.svg",
    publishedAt: "2020-02-11T21:05:00+09:00",
    tags: ["お知らせ", "モンハン"],
    likeCount: 18,
    body: [
      {
        kind: "paragraph",
        text: "中2のときから書いていたブログ「しろの狩猟記録」を閉じて、こっちに引っ越してきました。",
      },
      {
        kind: "paragraph",
        text: "前のブログは広告がどんどん増えて、自分で読んでいても重かったので。あと、昔の記事を読み返すと文章が恥ずかしすぎて、そのまま置いておくのがつらかったのもあります。",
      },
      { kind: "heading", text: "これから書くこと" },
      {
        kind: "paragraph",
        text: "いまはアイスボーンをやってます。攻略メモと、たまに日記。前のブログで人気だった装備の記事は、内容を今のバージョンに合わせて少しずつ書き直す予定です。",
      },
      {
        kind: "paragraph",
        text: "前のブログを読んでくれてた人、コメントくれてた人、ありがとうございました。こっちでもよろしくお願いします。",
      },
    ],
  },
  {
    id: "n3f8a21c0d9e4",
    creatorId: "shiro_hunt",
    title: "【MHWI】ムフェト・ジーヴァ、野良で行くときに気をつけてること",
    excerpt: "救難に入るときに私が守ってることを5つだけ。初めての人向けです。",
    cover: "/note-like/covers/notes.svg",
    publishedAt: "2020-02-24T16:40:00+09:00",
    tags: ["モンハン", "アイスボーン", "攻略"],
    likeCount: 41,
    body: [
      {
        kind: "paragraph",
        text: "ムフェト・ジーヴァの救難に入るようになって1か月くらい経ったので、私が気をつけてることをまとめます。上手い人向けではなく、初めて行く人向けです。",
      },
      { kind: "heading", text: "1. 頭か胸、どこを狙うか最初に決める" },
      {
        kind: "paragraph",
        text: "野良だと声をかけ合えないので、自分が担当する部位を決めておくと迷いません。私は双剣なので、だいたい胸を狙ってます。",
      },
      { kind: "heading", text: "2. 怒り状態の前に回復しておく" },
      {
        kind: "paragraph",
        text: "大技のあとに焦って回復しようとして、そのまま落ちる人をよく見ます（私もよくやりました）。怒る前に体力を満タンにしておくだけでかなり違います。",
      },
      { kind: "heading", text: "3〜5" },
      {
        kind: "paragraph",
        text: "残りの3つ（防具の耐性、閃光の使いどころ、地脈エネルギーの話）は長くなったので、次の記事に分けます。",
      },
    ],
  },
  {
    id: "n7b2d94e1a0c6",
    creatorId: "shiro_hunt",
    title: "ラージャン来た！！ 初見の感想",
    excerpt: "初見で3回乙りました。でも楽しい。",
    cover: "/note-like/covers/controller.svg",
    publishedAt: "2020-03-24T23:12:00+09:00",
    tags: ["モンハン", "アイスボーン", "日記"],
    likeCount: 22,
    body: [
      { kind: "paragraph", text: "ラージャンが来ました。初見で3回乙りました。" },
      {
        kind: "paragraph",
        text: "動きが速すぎて、双剣で張り付こうとしたら全部ふっ飛ばされます。でもモーションを覚えたら絶対楽しいやつだと思う。",
      },
      {
        kind: "paragraph",
        text: "今日はもう寝ます。明日も休校なので、明日がんばる。",
      },
    ],
  },
  {
    id: "n5c0e7f3b2a98",
    creatorId: "shiro_hunt",
    title: "休校中なので、ずっと導きの地にいる",
    excerpt: "学校がない日が続いて、導きの地の地帯レベルだけが上がっていく。",
    cover: "/note-like/covers/night-room.svg",
    publishedAt: "2020-04-18T22:30:00+09:00",
    tags: ["日記", "モンハン"],
    likeCount: 15,
    body: [
      {
        kind: "paragraph",
        text: "休校がまた延びました。課題はオンラインで出てるけど、気づいたら導きの地にいます。",
      },
      {
        kind: "paragraph",
        text: "地帯レベルの上げ下げが、いい感じに無心になれる作業なんです。リアルの予定が全部なくなったぶん、ゲームの中のほうが予定がぎっしりあるの、ちょっと面白い。",
      },
      {
        kind: "quote",
        text: "友達に「しろはいつもモンハンの話しかしない」と言われた。否定できない。",
      },
      {
        kind: "paragraph",
        text: "そろそろ課題やります。たぶん。",
      },
    ],
  },
  {
    id: "n9d4a6b8c1e25",
    creatorId: "shiro_hunt",
    title: "【MHWI】アルバトリオンの属性値ノルマがきつかった話",
    excerpt: "エスカトンジャッジメントで3回全滅して、やっと属性の大事さがわかった。",
    cover: "/note-like/covers/snowfield.svg",
    publishedAt: "2020-07-14T20:48:00+09:00",
    tags: ["モンハン", "アイスボーン", "攻略"],
    likeCount: 37,
    body: [
      {
        kind: "paragraph",
        text: "アルバトリオン、最初は「いつもの装備で行けるでしょ」と思っていたら、エスカトンジャッジメントで3回全滅しました。",
      },
      { kind: "heading", text: "属性の合計ダメージが足りないと全滅する" },
      {
        kind: "paragraph",
        text: "フィールドの状態に合わせて、氷か火の属性ダメージをある程度入れておかないといけません。双剣は手数が多いので相性はいいはずなのに、物理寄りの装備のままだと全然足りませんでした。",
      },
      {
        kind: "paragraph",
        text: "属性特化の装備を作り直してからは、野良でもちゃんと止められるようになりました。装備の中身は、まとまったらまた書きます。",
      },
    ],
  },
  {
    id: "n2e9f0a4d7b63",
    creatorId: "shiro_hunt",
    title: "夏休みの宿題が終わらないのに、狩りに行ってしまう",
    excerpt: "数学のワークが半分残ってる。",
    publishedAt: "2020-08-21T00:15:00+09:00",
    tags: ["日記"],
    likeCount: 11,
    body: [
      {
        kind: "paragraph",
        text: "数学のワークが半分残ってるのに、1狩りだけ、と言って3時間経った。",
      },
      {
        kind: "paragraph",
        text: "今年の夏休みは短いから、せめて宿題は早めに終わらせようと思ってたんですけどね。去年の私も同じことを言ってた気がする。",
      },
      { kind: "paragraph", text: "明日こそ午前中に終わらせます。" },
    ],
  },
  {
    id: "n6a3c1d8e0f47",
    creatorId: "shiro_hunt",
    title: "ミラボレアス、3日目でやっと勝てた",
    excerpt: "クリアした瞬間、深夜なのに声が出た。",
    cover: "/note-like/covers/moon-castle.svg",
    publishedAt: "2020-10-04T01:42:00+09:00",
    tags: ["モンハン", "アイスボーン", "日記"],
    likeCount: 52,
    body: [
      { kind: "paragraph", text: "ミラボレアス、配信から3日目でやっと勝てました。" },
      {
        kind: "paragraph",
        text: "最後は野良の4人で、全員1乙ずつしてもう後がない状態でした。クリアした瞬間、深夜なのに声が出て、隣の部屋から壁を叩かれました。ごめん。",
      },
      { kind: "divider" },
      {
        kind: "paragraph",
        text: "アイスボーンの大型アップデートはこれで最後らしいです。2018年からずっとワールドを遊んできたので、ちょっと寂しい。",
      },
    ],
  },
  {
    id: "n8f1b5e2c9a04",
    creatorId: "shiro_hunt",
    title: "【初心者向け】双剣の装飾品、最初にこれだけ付けておけばいい",
    excerpt: "装飾品が全然出ない人向けに、優先順位だけまとめました。",
    cover: "/note-like/covers/notes.svg",
    publishedAt: "2020-11-15T19:20:00+09:00",
    tags: ["モンハン", "アイスボーン", "攻略", "双剣"],
    likeCount: 64,
    body: [
      {
        kind: "paragraph",
        text: "前のブログでいちばん読まれていた「双剣の装飾品」の記事を、アイスボーン向けに書き直しました。",
      },
      { kind: "heading", text: "優先順位" },
      { kind: "paragraph", text: "1. 攻撃と見切り（まず会心率を上げる）" },
      { kind: "paragraph", text: "2. 体術（鬼人化中のスタミナ対策）" },
      { kind: "paragraph", text: "3. 属性強化（属性双剣を使う場合）" },
      {
        kind: "paragraph",
        text: "装飾品が出ないうちは、無理に揃えようとせず、防具のスキルで足りない分を補うくらいで大丈夫です。",
      },
      {
        kind: "quote",
        text: "前のブログの記事を見て双剣を始めました、と言ってくれた人がいて、すごくうれしかったです。",
      },
    ],
  },
  {
    id: "n4d7e0a9b3c52",
    creatorId: "shiro_hunt",
    title: "2020年の狩猟まとめ",
    excerpt: "今年いちばん遊んだのは、やっぱりアイスボーンでした。",
    cover: "/note-like/covers/controller.svg",
    publishedAt: "2020-12-30T22:05:00+09:00",
    tags: ["日記", "モンハン"],
    likeCount: 20,
    body: [
      {
        kind: "paragraph",
        text: "今年はほとんど家にいた一年でした。そのぶんアイスボーンをいちばん遊んだ年でもあります。",
      },
      { kind: "heading", text: "今年いちばん好きだったモンスター" },
      {
        kind: "paragraph",
        text: "ラージャンです。初見で3乙したのに、最後は双剣でいちばん楽しく戦える相手になりました。",
      },
      { kind: "heading", text: "来年" },
      {
        kind: "paragraph",
        text: "来年は受験生なので、ゲームは減らします。……と書いておけば、たぶん少しは減る。",
      },
    ],
  },
  {
    id: "n1c6a8f4e2d39",
    creatorId: "shiro_hunt",
    title: "ライズ発売日。でも受験生なので封印します",
    excerpt: "パッケージ版は買った。開けてはいない。",
    cover: "/note-like/covers/desk-lamp.svg",
    publishedAt: "2021-03-26T21:40:00+09:00",
    tags: ["日記", "モンハン"],
    likeCount: 29,
    body: [
      { kind: "paragraph", text: "今日はモンハンライズの発売日です。" },
      {
        kind: "paragraph",
        text: "パッケージ版は買いました。開けてはいません。来月から高3なので、受験が終わるまで封印すると決めました。",
      },
      {
        kind: "paragraph",
        text: "友達はみんな今夜から遊ぶらしくて、通知がずっと鳴ってます。つらい。",
      },
    ],
  },
  {
    id: "n0f2d7c5a8e16",
    creatorId: "shiro_hunt",
    title: "しばらく更新を止めます",
    excerpt: "受験が終わるまで、ここもTwitterもお休みします。",
    publishedAt: "2021-04-11T20:00:00+09:00",
    tags: ["お知らせ"],
    likeCount: 33,
    body: [
      {
        kind: "paragraph",
        text: "受験に集中したいので、しばらくここの更新を止めます。Twitterもお休みします。",
      },
      {
        kind: "paragraph",
        text: "中2から書き続けてきたので、止めるのはちょっと変な感じです。でも、このままだと絶対ゲームの話ばかりしてしまうので。",
      },
      {
        kind: "paragraph",
        text: "合格したら、ライズの記事から再開するかもしれません。読んでくれていた人、ありがとうございました。",
      },
    ],
  },

  // ---- 奏（kanade_gunlance）: 紛れ役 ----
  {
    id: "n5b9e1d3f7a20",
    creatorId: "kanade_gunlance",
    title: "ガンランスの砲撃タイプ、結局どれを選べばいいのか",
    excerpt: "通常・放射・拡散。迷ったら自分の手数で決めればいい。",
    cover: "/note-like/covers/notes.svg",
    publishedAt: "2020-06-06T13:30:00+09:00",
    tags: ["モンハン", "アイスボーン", "ガンランス", "攻略"],
    likeCount: 58,
    body: [
      {
        kind: "paragraph",
        text: "ガンランスを始めた人からいちばんよく聞かれるのが、砲撃タイプの選び方です。",
      },
      {
        kind: "paragraph",
        text: "結論から言うと、フルバーストを多用するなら通常型、竜撃砲を軸にするなら放射型、とりあえず全部の砲撃を気持ちよく撃ちたいなら拡散型です。",
      },
      {
        kind: "paragraph",
        text: "迷ったら、自分が1回の攻撃でどれくらい手数を出すかで決めるのがいいと思います。",
      },
    ],
  },
  {
    id: "n3a0c8e6b1d94",
    creatorId: "kanade_gunlance",
    title: "ワイルズのガンランス、最初の1週間",
    excerpt: "相殺がちゃんと強くて、ガンランス使いは泣いている。",
    cover: "/note-like/covers/controller.svg",
    publishedAt: "2025-03-08T22:10:00+09:00",
    tags: ["モンハン", "ワイルズ", "ガンランス"],
    likeCount: 74,
    body: [
      { kind: "paragraph", text: "ワイルズが出て1週間。ガンランスしか担いでいません。" },
      {
        kind: "paragraph",
        text: "盾で受けながら砲撃を入れていく流れが前作よりずっと自然で、ガードが苦手な人でも始めやすくなったと思います。",
      },
      {
        kind: "paragraph",
        text: "野良で「ガンランス助かる」と言われたのは今作が初めてです。泣きました。",
      },
    ],
  },

  // ---- 薬草メモ（yakusou_memo）: 紛れ役 ----
  {
    id: "n7e4f2a0c6b18",
    creatorId: "yakusou_memo",
    title: "アイスボーン、社会人でも置いていかれない進め方",
    excerpt: "平日1時間、週末3時間で、最新のモンスターまで追いついた方法。",
    cover: "/note-like/covers/night-room.svg",
    publishedAt: "2020-01-26T21:00:00+09:00",
    tags: ["モンハン", "アイスボーン", "社会人"],
    likeCount: 46,
    body: [
      {
        kind: "paragraph",
        text: "平日1時間、週末3時間くらいしか遊べない社会人が、アイスボーンで最新のモンスターまで追いついた進め方を書きます。",
      },
      {
        kind: "paragraph",
        text: "いちばん効いたのは、装備を作る前に「今週はこの1体だけ」と決めることでした。あれもこれも作ろうとすると、平日の1時間がすぐ消えます。",
      },
    ],
  },
  {
    id: "n2c5d9b7e3f60",
    creatorId: "yakusou_memo",
    title: "ワイルズ発売日、有休を取った",
    excerpt: "社会人になって初めて、ゲームのために有休を取りました。",
    cover: "/note-like/covers/controller.svg",
    publishedAt: "2025-02-28T23:50:00+09:00",
    tags: ["モンハン", "ワイルズ", "日記", "社会人"],
    likeCount: 38,
    body: [
      { kind: "paragraph", text: "社会人になって初めて、ゲームのために有休を取りました。" },
      {
        kind: "paragraph",
        text: "朝から始めて、気づいたらもうすぐ日付が変わります。ストーリーはまだ途中。明日も休みなので、このまま続けます。",
      },
    ],
  },
  {
    id: "n9a1e6c4d2b85",
    creatorId: "yakusou_memo",
    title: "ワイルズを1年半遊んで、社会人ハンターとして思うこと",
    excerpt: "マルチ募集のコミュニティに入ってから、遊び方が変わった。",
    cover: "/note-like/covers/headset.svg",
    publishedAt: "2026-10-12T21:30:00+09:00",
    tags: ["モンハン", "ワイルズ", "社会人"],
    likeCount: 27,
    body: [
      {
        kind: "paragraph",
        text: "ワイルズを発売日から1年半遊んで、いちばん変わったのは、ひとりで遊ばなくなったことです。",
      },
      {
        kind: "paragraph",
        text: "Discordのマルチ募集コミュニティに入ってから、平日の1時間が「誰かと狩る1時間」になりました。時間の短さは変わっていないのに、満足度は前作よりずっと高いです。",
      },
      {
        kind: "paragraph",
        text: "社会人で、ひとりで遊ぶのに少し疲れてきた人には、募集のコミュニティをおすすめしたいです。",
      },
    ],
  },
];

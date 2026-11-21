import type { Message } from "../../types";
import { mhcScript } from "./mhc-script";

/** 添付画像とピン留めの固定IDを含む投稿。返信はチャンネルの台本に記載。 */
const fixedPosts: Record<string, Message[]> = {
  "mhc-lfg": [
    {
      id: "mhc-lfg-0901",
      channelId: "mhc-lfg",
      authorId: "denden",
      sentAt: "2018-04-20T21:14:00+09:00",
      body: "ネルギガンテを周回するパーティー組みたいです！",
    },
    {
      id: "mhc-lfg-0902",
      channelId: "mhc-lfg",
      authorId: "jijii",
      sentAt: "2018-04-20T21:20:00+09:00",
      body: "参加したいです！",
    },
    {
      id: "mhc-lfg-0903",
      channelId: "mhc-lfg",
      authorId: "denden",
      sentAt: "2018-04-20T21:24:00+09:00",
      body: "フレンド申請送ってくれたらロビー招待します！",
    },
    {
      id: "mhc-lfg-0904",
      channelId: "mhc-lfg",
      authorId: "denden",
      sentAt: "2018-04-21T20:42:00+09:00",
      body: "双剣と弓の装備メモ、ブログの記事一覧にまとめました！よかったら見てください https://pochiblo.jp/mylist/k7q2m9d4",
    },
  ],
  "mhc-clips": [
    {
      id: "mhc-clips-0001",
      channelId: "mhc-clips",
      authorId: "hal",
      sentAt: "2025-02-11T14:27:00+09:00",
      body: "先週のテスト版。歩くだけで日が暮れたので、谷の出口を探すのやめて一枚撮りました",
      attachments: [
        { id: "mhc-clips-att-1", name: "clip-0211-1.png", kind: "image", sizeLabel: "2.0 MB" },
      ],
    },
    {
      id: "mhc-clips-0002",
      channelId: "mhc-clips",
      authorId: "hal",
      sentAt: "2025-03-12T20:29:00+09:00",
      body: "橋の手前まで色が残ってた。こっちから先、戻った時にはもう真っ暗だった",
      attachments: [
        { id: "mhc-clips-att-2", name: "clip-0312-2.png", kind: "image", sizeLabel: "3.1 MB" },
      ],
    },
    {
      id: "mhc-clips-0003",
      channelId: "mhc-clips",
      authorId: "maimai",
      sentAt: "2025-03-12T23:54:00+09:00",
      body: "三回目にやっとこの向きでみんな見えた。暗いのにわたしの装備だけやけに白い",
      attachments: [
        { id: "mhc-clips-att-3", name: "clip-0312-3.png", kind: "image", sizeLabel: "4.2 MB" },
      ],
    },
    {
      id: "mhc-clips-0004",
      channelId: "mhc-clips",
      authorId: "haruka",
      sentAt: "2025-03-18T16:27:00+09:00",
      body: "真ん中の光、笛が聞こえなくなった瞬間のやつ。消えた方の画面も持ってる人いる？",
      attachments: [
        { id: "mhc-clips-att-4", name: "clip-0318-4.png", kind: "image", sizeLabel: "5.3 MB" },
      ],
    },
    {
      id: "mhc-clips-0005",
      channelId: "mhc-clips",
      authorId: "gunlance",
      sentAt: "2025-04-18T16:10:00+09:00",
      body: "誰もいないとこんなに遠くまで見える。いつも奥まで来る前に地図の点が全部走り出す",
      attachments: [
        { id: "mhc-clips-att-5", name: "clip-0418-5.png", kind: "image", sizeLabel: "6.4 MB" },
      ],
    },
    {
      id: "mhc-clips-0006",
      channelId: "mhc-clips",
      authorId: "mina",
      sentAt: "2025-05-29T11:34:00+09:00",
      body: "この距離でもう逃げると思ったらふっと近づいてきた。初見だったから一回手が止まりました",
      attachments: [
        { id: "mhc-clips-att-6", name: "clip-0529-6.png", kind: "image", sizeLabel: "7.5 MB" },
      ],
      reactions: [{ emoji: "🙏", count: 2, me: false }],
    },
    {
      id: "mhc-clips-0007",
      channelId: "mhc-clips",
      authorId: "slime",
      sentAt: "2025-05-29T17:36:00+09:00",
      body: "こっちから見えてた盾の先はこんな感じ。出たのが一歩だけだったの、写真止めるまで知らなかった",
      attachments: [
        { id: "mhc-clips-att-7", name: "clip-0529-7.png", kind: "image", sizeLabel: "8.6 MB" },
      ],
    },
    {
      id: "mhc-clips-0008",
      channelId: "mhc-clips",
      authorId: "master",
      sentAt: "2025-06-02T15:29:00+09:00",
      body: "四人とも引き返してきたところです。一番早く戻った人が先に道を空けてくれたので全員入った",
      attachments: [
        { id: "mhc-clips-att-1", name: "clip-0602-1.png", kind: "image", sizeLabel: "2.0 MB" },
      ],
    },
    {
      id: "mhc-clips-0009",
      channelId: "mhc-clips",
      authorId: "jijii",
      sentAt: "2025-06-13T19:47:00+09:00",
      body: "看板の手前から撮ったぞ。笛吹いてるのに誰も来なかったから、今日はここを入口にする",
      attachments: [
        { id: "mhc-clips-att-2", name: "clip-0613-2.png", kind: "image", sizeLabel: "3.1 MB" },
      ],
    },
    {
      id: "mhc-clips-0010",
      channelId: "mhc-clips",
      authorId: "mina",
      sentAt: "2025-06-19T21:29:00+09:00",
      body: "フェンスの右側で最後まで見失った。上から見た時には壁なかったと思う人はこの角度見て",
      attachments: [
        { id: "mhc-clips-att-3", name: "clip-0619-3.png", kind: "image", sizeLabel: "4.2 MB" },
      ],
    },
    {
      id: "mhc-clips-0011",
      channelId: "mhc-clips",
      authorId: "master",
      sentAt: "2025-07-15T13:31:00+09:00",
      body: "落ち葉の向こうに小さい道が見えました。誰か一緒なら急がず歩いて通ってみたい",
      attachments: [
        { id: "mhc-clips-att-4", name: "clip-0715-4.png", kind: "image", sizeLabel: "5.3 MB" },
      ],
    },
    {
      id: "mhc-clips-0012",
      channelId: "mhc-clips",
      authorId: "maimai",
      sentAt: "2025-10-19T13:55:00+09:00",
      body: "飛ぶ前に振り向いて撮ればよかった。画面の下の足場、わたしがいちばん手前から落ちたところです",
      attachments: [
        { id: "mhc-clips-att-5", name: "clip-1019-5.png", kind: "image", sizeLabel: "6.4 MB" },
      ],
    },
    {
      id: "mhc-clips-0013",
      channelId: "mhc-clips",
      authorId: "maimai",
      sentAt: "2025-11-02T16:56:00+09:00",
      body: "ここで弓引き始めたら奥のやつまでぴったり当たった。狙ったって言い張るほど余裕なかったよ",
      attachments: [
        { id: "mhc-clips-att-6", name: "clip-1102-6.png", kind: "image", sizeLabel: "7.5 MB" },
      ],
      reactions: [{ emoji: "😂", count: 2, me: false }],
    },
    {
      id: "mhc-clips-0014",
      channelId: "mhc-clips",
      authorId: "mina",
      sentAt: "2025-12-08T16:03:00+09:00",
      body: "薬飲む間、横で二人が引きつけてくれてた。わたしはここからまだ動かなくてよかったんだ",
      attachments: [
        { id: "mhc-clips-att-7", name: "clip-1208-7.png", kind: "image", sizeLabel: "8.6 MB" },
      ],
    },
    {
      id: "mhc-clips-0015",
      channelId: "mhc-clips",
      authorId: "jijii",
      sentAt: "2026-02-04T15:20:00+09:00",
      body: "倒れきる前に撮ると顔が地面につく前に間に合う。最後に来た若いのの動きも写った",
      attachments: [
        { id: "mhc-clips-att-8", name: "clip-0204-8.png", kind: "image", sizeLabel: "9.7 MB" },
      ],
      editedAt: "2026-02-04T15:20:00+09:00",
    },
    {
      id: "mhc-clips-0016",
      channelId: "mhc-clips",
      authorId: "hal",
      sentAt: "2026-02-14T22:12:00+09:00",
      body: "このあと先に盾出した人が動くまで後ろで待ったら全員戻れた。僕は自分が走ったことしか覚えてなかった",
      attachments: [
        { id: "mhc-clips-att-9", name: "clip-0214-9.png", kind: "image", sizeLabel: "2.8 MB" },
      ],
    },
    {
      id: "mhc-clips-0017",
      channelId: "mhc-clips",
      authorId: "gunlance",
      sentAt: "2026-04-25T23:12:00+09:00",
      body: "盾を壁向きで出して失敗。昨日夜中に見ても分からんかったけど、この角度なら理由わかる",
      attachments: [
        { id: "mhc-clips-att-10", name: "clip-0425-1.png", kind: "image", sizeLabel: "3.0 MB" },
      ],
    },
    {
      id: "mhc-clips-0018",
      channelId: "mhc-clips",
      authorId: "maimai",
      sentAt: "2026-06-17T17:40:00+09:00",
      body: "今日は採取だけ。開けたばっかりの場所だから持ってきた武器一回も出さなかった",
      attachments: [
        { id: "mhc-clips-att-1", name: "clip-0617-1.png", kind: "image", sizeLabel: "2.0 MB" },
      ],
    },
    {
      id: "mhc-clips-0019",
      channelId: "mhc-clips",
      authorId: "master",
      sentAt: "2026-06-17T18:28:00+09:00",
      body: "先に進む人の目印にしようとしたところです。カメラ見ると、広い方じゃなく奥の壁を目指してた",
      attachments: [
        { id: "mhc-clips-att-2", name: "clip-0617-2.png", kind: "image", sizeLabel: "3.1 MB" },
      ],
    },
    {
      id: "mhc-clips-0020",
      channelId: "mhc-clips",
      authorId: "haruka",
      sentAt: "2026-06-17T20:25:00+09:00",
      body: "キャラが止まった位置より足元が写ったところから。ここ二人同時に抜けようとすると難しかった",
      attachments: [
        { id: "mhc-clips-att-3", name: "clip-0617-3.png", kind: "image", sizeLabel: "4.2 MB" },
      ],
    },
    {
      id: "mhc-clips-0021",
      channelId: "mhc-clips",
      authorId: "haruka",
      sentAt: "2026-06-26T12:50:00+09:00",
      body: "前に横から見てって言われた位置。壁の奥より手前の印で止まったら次に避けられた",
      attachments: [
        { id: "mhc-clips-att-4", name: "clip-0626-4.png", kind: "image", sizeLabel: "5.3 MB" },
      ],
    },
    {
      id: "mhc-clips-0022",
      channelId: "mhc-clips",
      authorId: "maimai",
      sentAt: "2026-07-24T15:07:00+09:00",
      body: "昼の試し撮り。よく見たらわたしだけ手袋の色違った。夜の集合まではこのままにする",
      attachments: [
        { id: "mhc-clips-att-5", name: "clip-0724-5.png", kind: "image", sizeLabel: "6.4 MB" },
      ],
    },
    {
      id: "mhc-clips-0023",
      channelId: "mhc-clips",
      authorId: "mina",
      sentAt: "2026-08-19T15:48:00+09:00",
      body: "夜まで戻ってから撮ったら、昼見てたときより黒に見える。これでも色の指定と同じ布です",
      attachments: [
        { id: "mhc-clips-att-1", name: "clip-0819-1.png", kind: "image", sizeLabel: "2.0 MB" },
      ],
    },
    {
      id: "mhc-clips-0024",
      channelId: "mhc-clips",
      authorId: "slime",
      sentAt: "2026-08-20T11:41:00+09:00",
      body: "夜の光の方を撮りたかったので戸口から。自分で撮った日の部屋は色の暗い人ほぼ見えない",
      attachments: [
        { id: "mhc-clips-att-2", name: "clip-0820-2.png", kind: "image", sizeLabel: "3.1 MB" },
      ],
    },
    {
      id: "mhc-clips-0025",
      channelId: "mhc-clips",
      authorId: "haruka",
      sentAt: "2026-08-26T17:47:00+09:00",
      body: "回線落ちる直前。隅に立ってる人をもう少し入れたかったけど、残ってたのこれ一枚でした",
      attachments: [
        { id: "mhc-clips-att-3", name: "clip-0826-3.png", kind: "image", sizeLabel: "4.2 MB" },
      ],
    },
    {
      id: "mhc-clips-0026",
      channelId: "mhc-clips",
      authorId: "mina",
      sentAt: "2026-09-05T18:42:00+09:00",
      body: "同じ場所、ソロだと戻る場所が無かったので最初に盾の位置代わりの石を目印にした",
      attachments: [
        { id: "mhc-clips-att-1", name: "clip-0905-1.png", kind: "image", sizeLabel: "2.0 MB" },
      ],
    },
    {
      id: "mhc-clips-0027",
      channelId: "mhc-clips",
      authorId: "haruka",
      sentAt: "2026-09-20T17:08:00+09:00",
      body: "四人じゃなく二人の弓で動いた日。ここだけお互いに反対の方を見てたのあとで分かった",
      attachments: [
        { id: "mhc-clips-att-2", name: "clip-0920-2.png", kind: "image", sizeLabel: "3.1 MB" },
      ],
    },
    {
      id: "mhc-clips-0028",
      channelId: "mhc-clips",
      authorId: "hal",
      sentAt: "2026-09-22T17:28:00+09:00",
      body: "急に撮ったのに四人入った。真ん中を空けようって言ったら半分ずつ右に寄ったところです",
      attachments: [
        { id: "mhc-clips-att-3", name: "clip-0922-3.png", kind: "image", sizeLabel: "4.2 MB" },
      ],
    },
    {
      id: "mhc-clips-0029",
      channelId: "mhc-clips",
      authorId: "haruka",
      sentAt: "2026-10-04T10:59:00+09:00",
      body: "見下ろす方から撮るとわたしがそんなに遠くにいなかったの分かる。昨日は右に逃げた後ここまで来てました",
      attachments: [
        { id: "mhc-clips-att-4", name: "clip-1004-4.png", kind: "image", sizeLabel: "5.3 MB" },
      ],
    },
    {
      id: "mhc-clips-0030",
      channelId: "mhc-clips",
      authorId: "hal",
      sentAt: "2026-10-25T20:48:00+09:00",
      body: "よく見たら僕の最後の一撃は空振りです。自信満々で送ろうとして一回止めたけど、もうこのままで",
      attachments: [
        { id: "mhc-clips-att-5", name: "clip-1025-5.png", kind: "image", sizeLabel: "6.4 MB" },
      ],
    },
    {
      id: "mhc-clips-0031",
      channelId: "mhc-clips",
      authorId: "haruka",
      sentAt: "2026-11-03T15:26:00+09:00",
      body: "残り一戦って決めてから毎回材料が出ないって言ってたけど、今日は最後に出た。夕方閉じて正解だった",
      attachments: [
        { id: "mhc-clips-att-6", name: "clip-1103-6.png", kind: "image", sizeLabel: "7.5 MB" },
      ],
      reactions: [{ emoji: "👍", count: 2, me: false }],
    },
    {
      id: "mhc-clips-0032",
      channelId: "mhc-clips",
      authorId: "haruka",
      sentAt: "2026-11-09T19:54:00+09:00",
      body: "一度逃げたあと、同じ向きで戻って撃ったところ。足元見えてなかった時より開けて撮れた",
      attachments: [
        { id: "mhc-clips-att-7", name: "clip-1109-7.png", kind: "image", sizeLabel: "8.6 MB" },
      ],
    },
    {
      id: "mhc-clips-0033",
      channelId: "mhc-clips",
      authorId: "haruka",
      sentAt: "2026-11-17T11:27:00+09:00",
      body: "",
      attachments: [
        { id: "mhc-clips-att-8", name: "clip-1117-8.png", kind: "image", sizeLabel: "9.7 MB" },
      ],
      editedAt: "2026-11-17T11:27:00+09:00",
    },
  ],
  "mhc-notice": [
    {
      id: "mhc-notice-0003",
      channelId: "mhc-notice",
      authorId: "master",
      sentAt: "2025-05-03T16:56:00+09:00",
      body: "集会所のルールを更新しました。募集はマルチ募集チャンネルでお願いします。",
      pinned: true,
    },
    {
      id: "mhc-notice-0005",
      channelId: "mhc-notice",
      authorId: "master",
      sentAt: "2025-06-18T19:40:00+09:00",
      body: "荒らし対策として、募集の連投は1時間に1回までにします。",
      pinned: true,
    },
  ],
};

export const messagesByChannelMhc: Record<string, Message[]> = Object.fromEntries(
  Object.entries(mhcScript).map(([channelId, messages]) => [
    channelId,
    [...messages, ...(fixedPosts[channelId] ?? [])].sort((a, b) =>
      a.sentAt.localeCompare(b.sentAt),
    ),
  ]),
);

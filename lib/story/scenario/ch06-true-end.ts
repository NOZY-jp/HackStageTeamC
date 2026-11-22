import { background, chat, effect, narrate, say, think, title } from "../stage";
import type { Beat } from "../types";

/**
 * 第六章：True End 分岐（4つの違和感がすべてそろったときに発生する判断の場面）。
 * `scenario/index.ts` では `ch6-bad-end` より前に並べ、4つの手がかりを先に集めきっていた場合は
 * Bad End を飛び越えてこの分岐が先に開くようにする。
 */
export const chapter6Branch: Beat[] = [
  {
    id: "ch6-branch",
    chapter: 6,
    layout: "overlay",
    when: [
      "s10-talkup-match",
      "s11-address",
      "te01-kai-nickname",
      "te02-kai-joined-mhc",
      "te03-talkup-kai-follower",
      "te04-kanon-stalker-post",
    ],
    after: ["ch5-talkup"],
    source: "True End 分岐",
    script: [
      title("……待てよ"),
      think("何かが、おかしい。さっきからずっと引っかかっていた点が、一本の線に繋がった。"),
      think(
        "まず、かのんさんの過去の投稿。二年前の秋――「友達がストーカーされてるっぽくてガチやばいー」って書いてあった。",
      ),
      think(
        "それから、11月13日のカイさんとのDMだ。初対面の前に「まいまいってカタツムリみたいだから、でんでんむしで『でんちゃん』って呼んでみたら？」って、あいつが言い出した。",
      ),
      think(
        "たまたま思いついたあだ名だと思っていたのに、旧ブログのコメント欄で、彼女のおばあちゃんだけが使っていた昔の名前と一字一句同じだった。",
      ),
      think(
        "僕がその呼び方を使い始めた直後――11月15日に、まいまいはTwixerで「知ってるはずのない言い回しを目にする」って怯えていたんだ。",
      ),
      think(
        "それだけじゃない。僕が「モンハンコミュニティで旧アカウントを見つけた」とDMで送った直後、元々いなかったはずのカイさんが、いつの間にかあのサーバーに参加していた。",
      ),
      think(
        "そしてTalkup。高校時代の写真部の仲間たちと並んで、まいまいのアカウントをフォローしていた「χ」――あれだけ、フォローバックされていなかった。",
      ),
      narrate("背筋に冷たいものが走る。"),
      think(
        "カイさんは、ただの親切な相談役じゃなかった。最初から全部知っていて、僕の手を借りて彼女を追い詰めようとしていたんじゃないか……？",
      ),
      think(
        "もし僕がこのまま直接、彼女の家へ押しかけたら――怯えている彼女にとって、いちばん恐ろしい相手と同じことをしてしまう。",
      ),
    ],
    choices: [
      {
        id: "confront-kai",
        label: "家へは行かず、カイに真相を確かめてまいまいに伝える",
        sets: ["choseTrueEnd"],
      },
      {
        id: "go-to-house-first",
        label: "気のせいだ――このまま直接、彼女の家へ向かう",
        unless: ["reachedBadEnd", "calledByName"],
        sets: ["choseBadEnd"],
      },
      {
        id: "go-to-house-again",
        label: "やはり直接、彼女の家へ行って説明する",
        requires: ["reachedBadEnd"],
        sets: ["choseBadEndAgain"],
      },
    ],
  },
];

/**
 * 第六章：True End 本編と、訪問後に判断をやり直す場面。
 */
export const chapter6TrueEnd: Beat[] = [
  {
    id: "ch6-bad-end-repeat",
    chapter: 6,
    layout: "fullscreen",
    when: ["choseBadEndAgain"],
    unless: ["choseTrueEnd"],
    after: ["ch6-branch"],
    source: "True End 分岐（再度の誤選択）",
    script: [
      background("black", { transition: "cut" }),
      title("第六章　現実"),
      background("street", { transition: "fade", duration: "slow" }),
      narrate("違和感を振り払うように足を早め、気づけば再びその玄関の前に立っていた。"),
      think("直接会って話せば、きっと誤解は解けるはずだ。そう思いたかった。"),
      narrate(
        "インターホンを押す。返ってきたのは、張りつめた沈黙と、チェーンをかけたまま数センチだけ開いたドアだった。",
      ),
      say("ryo", "まいまい、違うんだ、話を聞いてほしくて――"),
      narrate("言い終わる前に、隙間の奥で彼女の顔からすっと血の気が引いた。"),
      say("maimai", "……どうして、ここが分かったの。お願いだから、帰って"),
      say("ryo", "待って、僕は怖がらせるつもりなんて――"),
      effect("shake"),
      narrate("重い音とともにドアが閉ざされる。本鍵が二度、乾いた音を立てて回った。"),
      say("maimai", "もしもし、警察ですか……家の前に、見知らぬ男の人が来て……"),
      think("違う……そんなつもりじゃなかったのに。"),
      title("……"),
      effect("tint", { tint: "danger", duration: "slow" }),
      narrate("夜の住宅街に、赤い光とサイレンの音が近づいてくる。"),
      narrate("警察「落ち着いて。まずはここで話を聞かせてもらうよ」"),
      narrate("うつむいた僕の耳に、閉ざされたドアの向こうから震える声が届いた。"),
      narrate("「もう、つきまとわないで」"),
      effect("fade-to-black", { wait: true }),
      title("BAD END"),
    ],
    choices: [
      {
        id: "reconsider-after-repeat",
        label: "もう一度、判断をやり直す",
        sets: ["reconsiderBranch"],
      },
    ],
  },
  {
    id: "ch6-branch-retry",
    chapter: 6,
    layout: "overlay",
    when: ["reconsiderBranch"],
    unless: ["choseTrueEnd"],
    source: "True End 分岐（やり直し）",
    script: [
      think("……同じ過ちを繰り返すわけにはいかない。"),
      think("彼女の家の前に立つことだけは、絶対に違う。"),
      think(
        "いまならまだ、本当に向き合うべき相手に問い質して、彼女が安心できる距離から正直に伝えられる。",
      ),
    ],
    choices: [
      {
        id: "confront-kai-retry",
        label: "カイと向き合い、まいまいに正直に伝える",
        sets: ["choseTrueEnd"],
      },
      {
        id: "accept-bad-end",
        label: "このまま目を背ける",
        reply: [
          narrate("キーボードから指を離し、そのまま画面を閉じた。"),
          narrate("確かめるはずだった違和感も、届かなかった言葉も、暗い部屋に沈んだままだった。"),
        ],
      },
    ],
  },
  {
    id: "ch6-confront-kai",
    chapter: 6,
    layout: "overlay",
    place: "discord:dm-kai",
    when: ["choseTrueEnd"],
    after: ["ch5-talkup"],
    source: "True End：カイとの対峙",
    memo: "話したいことがある。",
    script: [
      title("第六章　真相"),
      think("深呼吸して、カイさんとのDMを開く。感情的にならず、確かめた事実だけを並べるんだ。"),
      chat(
        "discord:dm-kai",
        "ryo",
        "カイさん、今いいですか。一つだけ確かめたいことがあります",
        "2026-11-26T00:10:00+09:00",
      ),
      chat(
        "discord:dm-kai",
        "kai",
        "どうしました、琥珀さん。何か進展ありました？",
        "2026-11-26T00:10:35+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-kai",
        "ryo",
        "11月13日に、初対面の助言だって「でんちゃん」って呼び方を勧めてくれましたよね。あれ、まいまいの旧ブログで、おばあちゃんだけが呼んでた名前でした",
        "2026-11-26T00:11:10+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-kai",
        "ryo",
        "僕がその呼び方を使った翌日から、まいまいはTwixerで「知ってるはずのない言い回しを目にする」って怯えてたんです。偶然じゃないですよね",
        "2026-11-26T00:11:45+09:00",
        { wait: "normal" },
      ),
      narrate(
        "入力中の表示が一瞬ついて、すぐに消えた。数秒おいて、いつも通りの穏やかな文面が届く。",
      ),
      chat(
        "discord:dm-kai",
        "kai",
        "……ずいぶん細かいところまで見てるんですね、琥珀さん。でもカタツムリからの連想なんて珍しくないし、俺は旧ブログなんて知りませんよ",
        "2026-11-26T00:12:20+09:00",
        { wait: "slow" },
      ),
      chat(
        "discord:dm-kai",
        "ryo",
        "だったら、僕が「モンハンコミュニティで旧アカウントを見つけた」と送った直後に、元々いなかったあんたが黙ってサーバーに入ってきたのは何なんですか",
        "2026-11-26T00:12:55+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-kai",
        "ryo",
        "Talkupも見たよ。まいまいの高校時代のアカウント、写真部の仲間はみんな相互だったのに、「χ」だけフォローバックされてなかった。二年前、彼女の友達が「友達がストーカーされてるっぽい」って書いてたのも見た",
        "2026-11-26T00:13:30+09:00",
        { wait: "slow" },
      ),
      narrate(
        "長い沈黙が落ちる。やがて届いたメッセージから、丁寧な敬語がきれいに剥がれ落ちていた。",
      ),
      chat(
        "discord:dm-kai",
        "kai",
        "……はあ。せっかく最後まで綺麗に運んでやったのにな、琥珀",
        "2026-11-26T00:14:05+09:00",
        { wait: "slow" },
      ),
      chat(
        "discord:dm-kai",
        "kai",
        "昔の写真からずっと見てたのに、あいつ急に鍵かけてゲームの中に逃げやがってさ。こっちは手間かけてたのに、お前みたいなのが横から気安く仲良くしてるのが気に食わなかったんだよ",
        "2026-11-26T00:14:25+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-kai",
        "kai",
        "昔の名前を呼ばせて怯えさせて、住所までお前に辿らせて玄関に立たせれば、あいつは完全に壊れてお前を憎む。俺は手を汚さずに全部見られるはずだったんだけどな",
        "2026-11-26T00:14:45+09:00",
        { wait: "slow" },
      ),
      think("……やっぱり、そうだったのか。吐き気がする。"),
      chat(
        "discord:dm-kai",
        "ryo",
        "ふざけるな。彼女の家には絶対に行かない。あんたが何を仕組んでたかも、全部まいまいに正直に話す",
        "2026-11-26T00:14:55+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-kai",
        "kai",
        "好きにしろよ。まあ、怯えてるあいつがお前の話を信じればの話だけどな",
        "2026-11-26T00:15:00+09:00",
        { wait: "normal" },
      ),
      narrate(
        "それきり、画面右上のアイコンがオフラインに切り替わった。返信欄の下に「このユーザーとは現在メッセージをやり取りできません」という表示が残る。",
      ),
      think("……終わった。次は、まいまいだ。絶対に勝手なことはせず、DMで全部正直に伝えよう。"),
    ],
  },
  {
    id: "ch6-maimai-reply",
    chapter: 6,
    layout: "overlay",
    place: "discord:dm-maimai",
    when: ["choseTrueEnd"],
    after: ["ch6-confront-kai"],
    source: "True End：MaiMaiへの告白と返信",
    script: [
      think("11月19日から止まったままのDM画面。指先が少し震えるけれど、隠さず全部言葉にしよう。"),
      chat(
        "discord:dm-maimai",
        "ryo",
        "まいまい、夜遅くに長文ごめん。返事は無理にしなくていいから、これだけ伝えさせてほしい",
        "2026-11-26T00:18:00+09:00",
      ),
      chat(
        "discord:dm-maimai",
        "ryo",
        "連絡が途絶えて心配で、昔のブログやSNSまで辿ってしまった。本当にごめん。勝手に会いに行くことだけは絶対にしないから、安心してほしい",
        "2026-11-26T00:18:40+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-maimai",
        "ryo",
        "それと、僕が「でんちゃん」って呼んでしまったこと。あれは11月13日にカイさんから「そう呼んでみたら」と勧められたんだ。おばあちゃんだけの呼び方だったなんて知らなかった。怖がらせて本当にごめん",
        "2026-11-26T00:19:25+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-maimai",
        "ryo",
        "カイさんが昔からまいまいのアカウントを追っていたことにもさっき気づいた。僕も利用されてた。さっき問い詰めて、もうカイさんとは縁を切ったよ",
        "2026-11-26T00:20:05+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-maimai",
        "ryo",
        "もし怖かったら、このままブロックしてくれていい。ただ、僕はずっと「まいまい」と遊んでた時間が大好きだった。それだけは嘘じゃないよ",
        "2026-11-26T00:20:45+09:00",
        { wait: "slow" },
      ),
      narrate("送信ボタンを押して、椅子にもたれかかる。"),
      title("……"),
      think(
        "既読がつくかどうかも分からない。このまま返事が来なくても、それが彼女の選んだ安全なら受け止めるしかない。",
      ),
      narrate("――そのとき、画面の下に小さな文字が灯った。"),
      narrate("『MaiMai が入力中…』"),
      think("……っ！"),
      chat("discord:dm-maimai", "maimai", "……琥珀", "2026-11-26T00:22:30+09:00", {
        wait: "slow",
      }),
      chat("discord:dm-maimai", "maimai", "ずっと、怖かった", "2026-11-26T00:22:55+09:00", {
        wait: "normal",
      }),
      chat(
        "discord:dm-maimai",
        "maimai",
        "あの呼び方、おばあちゃんしか呼んだことないのに。二年くらい前、昔の写真アカウントの頃からずっとつきまとわれてた人がいて……やっと逃げ切れたと思ってたのに、琥珀の口からその呼び方が出て、頭が真っ白になった",
        "2026-11-26T00:23:30+09:00",
        { wait: "slow" },
      ),
      chat(
        "discord:dm-maimai",
        "maimai",
        "琥珀まで同じ人だったらどうしようって、通話から逃げて、そのまま何も返せなくなって……本当にごめんね",
        "2026-11-26T00:24:00+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-maimai",
        "ryo",
        "謝らないで。すごく怖かったよな……僕こそ、何も知らずに平気で呼んでごめん",
        "2026-11-26T00:24:20+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-maimai",
        "maimai",
        "……家の前まで来ないでくれて、よかった。ちゃんと立ち止まって、気づいて、教えてくれてありがとう",
        "2026-11-26T00:24:40+09:00",
        { wait: "normal" },
      ),
      chat(
        "discord:dm-maimai",
        "maimai",
        "もし、まだ嫌いになってなかったら……今度はわたしのほうから会いたいな。今度の土曜のお昼、駅前の喫茶店で、どう？",
        "2026-11-26T00:24:50+09:00",
        { wait: "slow" },
      ),
      narrate("画面の文字を二度読み返して、思わず息が漏れた。"),
      chat(
        "discord:dm-maimai",
        "ryo",
        "嫌いになるわけないよ。喜んで行く。土曜のお昼、駅前の喫茶店で待ってる",
        "2026-11-26T00:25:00+09:00",
        { wait: "normal" },
      ),
    ],
  },
  {
    id: "ch6-true-end",
    chapter: 6,
    layout: "fullscreen",
    when: ["choseTrueEnd"],
    after: ["ch6-maimai-reply"],
    source: "True End：再会",
    script: [
      background("black", { transition: "cut" }),
      title("数日後"),
      background("station", { transition: "fade", duration: "slow" }),
      narrate(
        "冬の入り口の澄んだ昼下がり。改札前の明るい日差しは、あの暗い夜とはまるで違っていた。",
      ),
      think(
        "ベージュのパンツに青いシャツ、その上に黒のジャケット……さすがに赤いキャリーケースまでは持ってこなかったけど。",
      ),
      narrate(
        "約束の時間より少し前に着いて深呼吸をしていると、人混みの向こうで、こちらを見つけて足を止めた人がいた。",
      ),
      background("cafe", { transition: "fade", duration: "slow" }),
      narrate("駅前の喫茶店。窓際の席に運ばれてきたカップから、やわらかい湯気が立ちのぼる。"),
      say("maimai", "……ほんとに、あのとき言ってた通りの服なんだね"),
      say("ryo", "そりゃ、見つけてもらいやすいようにって言われたからね"),
      say("maimai", "ふふ……画面越しじゃないのに、声はいつもの琥珀だ"),
      narrate("少し照れたように笑う顔を見て、胸の奥でずっと張りつめていた糸がようやくほどけた。"),
      say(
        "maimai",
        "ねえ、わたしからもちゃんと謝らせて。急に黙っていなくなって、たくさん心配させたよね",
      ),
      say(
        "ryo",
        "ううん。僕も勝手に過去のことを探りすぎてた。次からは、不安なことがあったらちゃんと話そう",
      ),
      say("maimai", "……うん。もう黙って逃げないよ"),
      narrate("カップを置いた彼女が、少しだけ背筋を伸ばしてまっすぐこちらを見る。"),
      say("ryo", "――はじめまして、まいまい。"),
      say("maimai", "……はじめまして、琥珀。"),
      narrate("誰かが仕掛けた嘘も、すれ違いの筋書きも、もうここにはない。"),
      narrate("彼女自身の足で歩いてきてくれた、本当のはじめましてだった。"),
      effect("fade-to-black", { wait: true }),
      title("TRUE END"),
    ],
  },
];

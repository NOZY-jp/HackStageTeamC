import { background, chat, narrate, think, title } from "../stage";
import type { Beat } from "../types";

/** 序章の通話を終えると、翌日の待ち合わせへ進む。 */
export const chapter2: Beat[] = [
  {
    id: "ch2-disappearance",
    chapter: 2,
    layout: "fullscreen",
    when: ["started", "leftCall"],
    after: ["ch1-prologue"],
    source: "Google Docs 箱書き 第二章",
    script: [
      background("black", { transition: "cut" }),
      title("第二章　失踪"),
      think("ちょっと早めに到着したけど、まいまいはまだ着いてなさそう"),
      chat(
        "discord:dm-maimai",
        "ryo",
        "こっちはもう着いたけどゆっくり来ていいよ",
        "2026-11-20T12:52:00+09:00",
      ),
      think("ん、昨日のゲームから返信が来てないけど大丈夫かな"),
      think("まさか寝落ちしたまま寝坊……？"),
      think("でもゲームのイベントがあるたび時間ぴったし参加してたあいつが遅れるとは考えにくいよな"),
      title("……"),
      think("うーん遅くないか……？"),
      think("約束した時間から2時間は経ってるし、何も連絡が来ない"),
      think("せっかくある程度デートプラン考えてたんだけど、もう日を改めた方がいいか"),
      narrate("珍しいこともあるものだなと思いながら、僕はリスケの連絡を送った。"),
      title("……"),
      think("流石におかしい"),
      narrate("最後にメッセージを送ってから3日経つけど返信が来る気配がない"),
      think("SNSを最後に投稿したのもずいぶん前みたいだし、どうしたんだろう"),
      think("心配だけどネットで知り合った彼女だからリアルで会いにいけないし..."),
      think("ひょっとして失踪……？破局……？"),
      think("僕の短い恋愛生活もここで終わりか……いや、だとしても急に連絡なく別れることあるか？"),
      think("別に最後に話したときは険悪な感じじゃなかったし、理由があれば話してくれるはず……"),
      think("ひょっとして急に連絡が取れなくなった事情があるんじゃなのか？"),
      think("事件や事故だったりしたらどうしよう..."),
      think("ひとまず情報がない以上なにもできないから情報収集からだな"),
    ],
  },
];

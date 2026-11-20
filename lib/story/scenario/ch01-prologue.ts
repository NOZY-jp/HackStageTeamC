import { call, narrate, title, voice, wait } from "../stage";
import type { Beat } from "../types";

/**
 * 第一章：序章（Google Docs「HackStageTeamC」の箱書き 第一章。清書ができたら差し替える）。
 * デートの前の晩、Discord のボイスチャンネル「深夜の集会」で通話しながら狩りをしている場面。
 * その画面を開いたときに始まり（place）、話している人の枠が光る。
 * 「*ミュート」「*通話退出」は Discord の通話の画面で見せ（voice）、「…」は間（場面転換の表示）にした。
 * 文面は箱書きのまま（でんちゃんの由来が #76 と違う点は、清書で確認する）。
 */
export const chapter1: Beat[] = [
  {
    id: "ch1-prologue",
    chapter: 1,
    layout: "overlay",
    place: "discord:vc-night",
    when: ["started"],
    source: "Google Docs 箱書き 第一章",
    script: [
      voice("discord:mhc-vc-3", "ryo", "join"),
      voice("discord:mhc-vc-3", "maimai", "join"),
      title("第一章　序章"),
      call("ryo", "ごめん！ちょっとHPまずい！"),
      call("maimai", "おっけーそこで回復しといて、ふん！"),
      narrate("長年このゲームを攻略してきた僕の彼女が慣れた手つきでカバーしてくれた。"),
      narrate("シリーズ前作もやり込んでいたみたいだから流石なものだ。"),
      call("ryo", "ナイスカバー、一旦下がる"),
      call("maimai", "やるでしょ"),
      call("ryo", "回復できたらすぐそっち復帰する"),
      call("maimai", "よし、ダウン取った！"),
      call("ryo", "歴が長いだけあって弱点熟知してるね"),
      call("maimai", "まぁね、わたしが何年遊んでると思ってるの"),
      title("……"),
      call("ryo", "ほしい素材手に入ったし、夜遅いしどうする？"),
      call("maimai", "そうね、今日はこのぐらいで切り上げようか"),
      call("ryo", "それにしても明日のデート楽しみだな〜"),
      call("ryo", "回るところはある程度考えといたからキャリーは任せてほしい"),
      call("maimai", "ゲームではわたしにキャリーされてくせに"),
      call("ryo", "それは精進します……"),
      call("ryo", "場所だけ共有しておけばいいかな？"),
      call("maimai", "それと明日どんな服着るか伝えとかないと合流できないじゃん"),
      call("ryo", "確かに！完全に失念してた。明日は……"),
      call(
        "ryo",
        "ベージュのパンツに青色のシャツ、その上に黒のジャケットを羽織るよ。赤いキャリーケースもってく",
      ),
      call("maimai", "なんか気合入ってそうな服装だね"),
      call("ryo", "当然"),
      call("ryo", "だって初めて会えるんだ"),
      call("maimai", "そうだね"),
      call("ryo", "でんちゃんはどうすんの？"),
      call("maimai", "その呼び方気に入ってるの？maimaiでいいって"),
      narrate(
        "でんちゃんというのはカタツムリの和名「マイマイ」からとった名前をもじったあだ名だ。ほら、でんでんむしっていうだろ？",
      ),
      narrate("この前ゲーム仲間のカイが思いついて、語呂がいいから定着してしまった。"),
      call("ryo", "えー？でもかわいいじゃん"),
      call("maimai", "いや、まいまいもかわいいでしょ。自分で言うの恥ずいな"),
      call("ryo", "で、どんな服装？"),
      call("maimai", "うーん絶賛悩み中なんだよね。どうしよ……"),
      call("maimai", "あ、ごめん。親から電話だ"),
      call("ryo", "分かった、気にせず行ってきて"),
      call("maimai", "うん、離席する"),
      voice("discord:mhc-vc-3", "maimai", "mute"),
      title("……"),
      narrate("1時間は経っただろうか、戻ってくる様子はなかった。"),
      call("ryo", "うーんそんな長電話してるのかな、それとも寝落ち？"),
      call("ryo", "明日は遅れるわけにはいかないし、今日はもう寝るか"),
      voice("discord:mhc-vc-3", "ryo", "leave"),
      wait("slow"),
    ],
  },
];

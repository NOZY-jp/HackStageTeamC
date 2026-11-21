import { background, effect, narrate, say, think, title, todo } from "../stage";
import type { Beat } from "../types";

/**
 * 第六章：現実（悪い結末。Google Docs「HackStageTeamC」の箱書き 第六章（Bad End）。清書ができたら差し替える）。
 * 彼女の家を訪ね、「その呼び方」で怯えられ、通報される。
 * 住所を特定したこと（段階11。#159 の結末の選択「住所を特定しました」で立つ）のあとに始まる。
 * 「でんちゃん」の助言を通ったかで分ける分岐（#120）は、まだ入れていない。
 *
 * - 本名を名乗る行は、作中に本名を出さない決まり（#76）があるので仮置き（todo）にした
 * - 箱書きの「noteから」は、作中の名前の「leafから」にした
 * - 名前の無い声（インターホン・警察）は、地の文で「」つきにした
 * - 真の結末（True End）は箱書きにまだ文章が無い
 */
export const chapter6: Beat[] = [
  {
    id: "ch6-bad-end",
    chapter: 6,
    layout: "fullscreen",
    when: ["s11-address"],
    after: ["ch5-talkup"],
    source: "Google Docs 箱書き 第六章（Bad End）",
    script: [
      background("black", { transition: "cut" }),
      title("第六章　現実"),
      background("street", { transition: "fade", duration: "slow" }),
      narrate("ピンポーン"),
      think("もし合っていたらこれが初対面になるな。"),
      narrate("指が妙に震えているし、心臓がバクバク鼓動している。"),
      say("ryo", "すみませーん、どなたかいらっしゃいますかー？"),
      narrate("少しすると、スピーカーから声が返ってきた"),
      narrate("「……どなたでしょうか？」"),
      todo(
        say("ryo"),
        "「すみません、こちらは（本名）さんのご自宅でしょうか？」（作中に本名を出さない決まり）",
      ),
      narrate("「はい、そうですが……」"),
      say("maimai", "もしかして、琥珀……?"),
      narrate("心拍数が上がる。"),
      narrate("聞き覚えのある声、もう一度聞きたかった声だ。"),
      say("ryo", "そうだよ！僕だよでんちゃん！"),
      say("ryo", "急に連絡が取れなくなったから会いに来たんだ！"),
      say("ryo", "本当に心配したんだからね！"),
      narrate(
        "返事の代わりに聞こえたのは、チェーンを外す音ではなく、チェーンをかけたままドアが数センチ開く",
      ),
      say("maimai", "……なんで"),
      say("ryo", "え？"),
      say("maimai", "なんで、ここ、分かったの"),
      say("ryo", "色々調べたんだよ、ブログから、leafから……すごく大変だったけど"),
      narrate("説明しながら、たぶん僕は変な顔で笑っていた。"),
      narrate("彼女の顔から血の気が引いていくのが分かった。数センチの隙間が、さらに狭くなる。"),
      say("maimai", "その呼び方……"),
      say("maimai", "その呼び方、どこで――"),
      say("ryo", "ど、どういうこと？"),
      effect("shake"),
      narrate("ドアが閉まる。鍵の音が二回。チェーンじゃない、本鍵が、二回。"),
      say("maimai", "もしもし、警察ですか?あの、家の前に、男の人が……"),
      think("なんで？"),
      think("通報？僕が？"),
      think("何をしたっていうんだ……"),
      title("……"),
      effect("tint", { tint: "danger", duration: "slow" }),
      narrate("サイレンはそれから十分ほどで来た。"),
      say("ryo", "あの、僕は、その、彼女の"),
      narrate("警察「手、見えるところに出してください」"),
      say("ryo", "待ってください、僕は、ただ、連絡が取れなくて"),
      narrate("警察「続きは後で聞くから」"),
      narrate("その時、ドアの隙間から声が聞こえた。"),
      narrate("「もう、つきまとわないで」"),
      effect("fade-to-black", { wait: true }),
      title("主人公ストーカーEND"),
    ],
  },
];

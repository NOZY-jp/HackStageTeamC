import { narrate, say, think, title } from "../stage";
import type { Beat } from "../types";

/**
 * 第三章：助言（Google Docs「HackStageTeamC」の箱書き 第三章。清書ができたら差し替える）。
 * カイに相談してブログの話を聞き（Discord）、Twixer のリプライからブログにたどり着く。
 *
 * - ブログ名は #76 と実データに合わせて「でんでんの狩猟日記」にした（箱書きは「狩猟記録」）
 */
export const chapter3: Beat[] = [
  {
    id: "ch3-ask-kai",
    chapter: 3,
    layout: "overlay",
    place: "discord",
    when: ["started", "leftCall"],
    after: ["ch2-disappearance"],
    source: "Google Docs 箱書き 第三章",
    script: [
      title("第三章　助言"),
      think("情報収集と言っても何から始めるべきか..."),
      think("SNSは動いてないみたいだし、共通の友人に聞き取り調査とかからか？"),
      think("カイに聞いてみるか"),
      narrate("カイとはゲーム仲間でたまに僕とでんちゃんとパーティーを組んで遊んだりしてる。"),
      narrate("今回の失踪もひょっとしたらあいつに聞けば何か分かるかもしれない。"),
      think("ゲームサーバーでよく浮上しているし、情報通のあいつなら何か知っているかもしれないな"),
      say("ryo", "最近でんちゃんと連絡が取れないんだけど何か知ってたりするかな？"),
      say("ryo", "今結構心配しててなにか知ってたら教えてほしい"),
      say("kai", "え、連絡取れなくなったってほんと？"),
      say("kai", "君たちあれだけ一緒に遊んでたのに急にどうしたの"),
      say("ryo", "僕が知りたいよ"),
      say("ryo", "SNSも更新が止まってて途方に暮れているところ"),
      say("kai", "うーん分かった、俺の方でも何か手伝えることあるか考えてみる"),
      say("ryo", "ガチで助かる！"),
      say("kai", "そういえば、まいまいって前にブログを書いてたとかって言ってなかった？"),
      say("ryo", "ブログ？やってたっけ"),
      say("kai", "確か過去の会話を遡ると……ほら、ブログで検索かけたら"),
      narrate(
        "MaiMai（過去のチャット）「わたしこのゲームほんと好きでね、昔っから遊んでるんだよね」",
      ),
      narrate(
        "MaiMai（過去のチャット）「前のシリーズとかめっちゃやり込んでて攻略のブログも書いてるんだから」",
      ),
      say("kai", "どうやら君たちがよく遊んでるゲームの攻略ブログを執筆してたみたいだね"),
      say("kai", "他のプラットフォームで調べてみたらブログの内容も分かるんじゃない？"),
      think("ブログ……Twixerでもブログについて検索かけてみたら何か分かるかも"),
    ],
    sets: ["askedKai", "s01-blog-talk"],
  },
  {
    id: "ch3-blog-found",
    chapter: 3,
    layout: "overlay",
    when: ["s03-blog-found"],
    after: ["ch3-ask-kai"],
    source: "Google Docs 箱書き 第三章",
    script: [
      narrate("カイの助言とこのリプでブログまでたどり着いた。"),
      think("このブログだとでんでんの狩猟日記って名前で活動していたのか"),
      think("間違いなくでんちゃんのブログだけど"),
      think("ダメだ、ブログまで辿れたのはいいけど封鎖されているな"),
      think("うーんと、『leafに記事を移行しました。』って書いてある"),
      think("leafか、名前だけ聞いたことあるけど使ったことないな"),
      think("移行してるなら同じ名前でヒットするかも"),
    ],
  },
];

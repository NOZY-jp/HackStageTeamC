import { narrate, think, title } from "../stage";
import type { Beat } from "../types";

/**
 * 第五章：欠片（Google Docs「HackStageTeamC」の箱書き 第五章。清書ができたら差し替える）。
 * talkup で本人のアカウントを見つけ、住んでいる地域を絞る。
 *
 * - 第五章の前半（カイから進捗を聞かれ、本名で検索するよう言われる）は、#159（#119・#154）が
 *   カイとの DM の場面 ch5-kai-contact として作っているので、ここには入れない（作業が重ならないように）
 * - 箱書きの「FaceBook」は、作中の名前の「talkup」にした
 * - 箱書きの《…》と「執筆メモ」は台詞ではないので入れていない
 */
export const chapter5: Beat[] = [
  {
    id: "ch5-talkup",
    chapter: 5,
    layout: "overlay",
    // カイから「本名で検索したら出てくるぞ」と言われ（段階9・#159 の ch5-kai-contact）、talkup で照合できたら
    when: ["s09-kai-contact", "s10-talkup-match"],
    after: ["ch4-real-name"],
    source: "Google Docs 箱書き 第五章",
    script: [
      title("第五章　欠片"),
      think("よしビンゴ！でんちゃんのtalkupアカウントを見つけた！"),
      narrate("talkupやってたのはちょっと意外。"),
      narrate(
        "それはさておき投稿内容に目を通してみると、入学式の写真やプライベートな写真が投稿されている。",
      ),
      think("入学式の写真か、それ意外にもプライベートな写真が結構あるな"),
      narrate("高校の入学式から校名は割れた。"),
      narrate("あとは簡単、それをマップアプリで調べるだけだ。"),
      think("でんちゃんはこのあたりに住んでいるのか"),
      narrate("このあたりをマップアプリで散策してみる。"),
      title("……"),
      narrate("よし、talkupの投稿と合致する風景と本名と合致する表札を見つけた。"),
      think("現地凸、するか"),
    ],
  },
];

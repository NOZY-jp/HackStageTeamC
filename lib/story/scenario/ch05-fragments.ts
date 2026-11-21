import { hideWindow, look, narrate, think, title } from "../stage";
import type { Beat } from "../types";
import { kaiDm } from "./kai-dm";

/**
 * 第五章：欠片（Google Docs「HackStageTeamC」の箱書き 第五章。清書ができたら差し替える）。
 * カイからの DM で進捗を共有し、Talkup での本名検索の助言を受け、本人を見つけて地域を絞る。
 */
export const chapter5: Beat[] = [
  {
    id: "ch5-kai-contact",
    chapter: 5,
    layout: "overlay",
    place: "discord:dm-kai",
    when: ["s08-real-name"],
    sets: ["s09-kai-contact", "kaiToldDenchan"],
    source: "Google Docs 箱書き 第五章・Issue #76 順序9",
    script: [
      title("第五章　欠片"),
      hideWindow(),
      kaiDm("kai", "今の進捗どう？", "2026-11-25T23:50:00+09:00"),
      kaiDm("ryo", "今ようやく前に聞いたブログの中身が分かったところ", "2026-11-25T23:51:00+09:00"),
      kaiDm(
        "ryo",
        "本名も分かったんだけど、そこから先がなかなか進まなくて",
        "2026-11-25T23:51:30+09:00",
      ),
      kaiDm("kai", "Talkupだと本名で検索したら結構出てくるぞ？", "2026-11-25T23:52:00+09:00"),
      kaiDm("ryo", "て、天才か？", "2026-11-25T23:52:30+09:00"),
      kaiDm("kai", "そういえば、でんちゃんって呼ぶと喜ぶぞ", "2026-11-25T23:53:00+09:00"),
      kaiDm("ryo", "でんちゃん？", "2026-11-25T23:53:30+09:00"),
      kaiDm("kai", "昔の呼び名らしい。俺も聞いただけだけどな", "2026-11-25T23:54:00+09:00"),
      think("本名でTalkupを検索してみよう。"),
    ],
  },
  {
    id: "ch5-talkup",
    chapter: 5,
    layout: "overlay",
    when: ["s08-real-name", "s09-kai-contact", "s10-talkup-match"],
    after: ["ch5-kai-contact"],
    source: "Google Docs 箱書き 第五章",
    script: [
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
      ...look({ src: "/story/backgrounds/sweets-shop.webp", label: "地元の洋菓子店" }),
      title("……"),
      ...look({
        src: "/story/backgrounds/manhole-street.webp",
        label: "マンホールのある住宅街",
      }),
      narrate("よし、talkupの投稿と合致する風景と本名と合致する表札を見つけた。"),
      think("現地凸、するか"),
    ],
    choices: [
      {
        id: "visit-house",
        label: "現地へ向かう",
        sets: ["s11-address"],
      },
    ],
  },
];

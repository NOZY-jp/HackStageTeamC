import { background, hideWindow, look, narrate, think, title } from "../stage";
import type { Beat } from "../types";
import { kaiDm } from "./kai-dm";

/**
 * 第五章：欠片（Google Docs「HackStageTeamC」の箱書き 第五章。清書ができたら差し替える）。
 * カイからの DM で進捗を共有し、Talkup の話が出る。写真を見た場面では、画面に残っているものを描写する。
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
      kaiDm(
        "kai",
        "俺、ゲーム仲間の近況をTalkupの写真で知ったことがあるよ。",
        "2026-11-25T23:52:00+09:00",
      ),
      kaiDm("ryo", "写真か。僕はそういうの、見たことなかった。", "2026-11-25T23:52:30+09:00"),
      kaiDm("kai", "そういえば、でんちゃんって呼ぶと喜ぶぞ", "2026-11-25T23:53:00+09:00"),
      kaiDm("ryo", "でんちゃん？", "2026-11-25T23:53:30+09:00"),
      kaiDm("kai", "昔の呼び名らしい。俺も聞いただけだけどな", "2026-11-25T23:54:00+09:00"),
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
      think("前に見た写真と、同じ二人が写っている。"),
      narrate("ゲームの画面でしか知らない人の写真が並んでいる。不思議な感じがする。"),
      think("入学式の写真も、ふだんの写真もある。"),
      narrate("入学式の写真の端に、校名が写っている。"),
      // 散策の途中：地元の少し有名な洋菓子店。絵を見せて、押したら文章へ
      background("sweets-shop", { transition: "fade", duration: "slow" }),
      ...look(),
      title("……"),
      // マンホールの絵柄から絞り込んだ通り。マンホールが文章の窓に隠れないよう、先に絵だけ見せる
      background("manhole-street", { transition: "fade", duration: "slow" }),
      ...look(),
      narrate("写真と同じ絵柄のマンホールがある。その先の表札には、見覚えのある文字が並んでいる。"),
      think("息を吸ってから、しばらく画面を見ていた。"),
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

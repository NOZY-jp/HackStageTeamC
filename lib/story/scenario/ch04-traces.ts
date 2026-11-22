import { characters } from "../characters";
import { chat, hideWindow, narrate, think, title } from "../stage";
import type { Beat } from "../types";
import { kaiDm } from "./kai-dm";

/**
 * 第四章：痕跡（Google Docs「HackStageTeamC」の箱書き 第四章。清書ができたら差し替える）。
 * leaf の画像の古いゲーマーID → コミュニティの古いアカウント → 古いブログの記事一覧 → 写真コンテスト → 本名 →
 * Twixer の古いアカウント（鍵垢）と BFF のアカウント、と進む。各場面は謎解きの段階に着いたときに始まる。
 */
export const chapter4: Beat[] = [
  {
    id: "ch4-leaf",
    chapter: 4,
    layout: "overlay",
    place: "discord:dm-kai",
    when: ["s04-old-id-screenshot"],
    after: ["ch3-blog-found"],
    source: "Google Docs 箱書き 第四章",
    script: [
      title("第四章　痕跡"),
      think("leafの記事に、当時のプレイ画面が載っている。"),
      think("ここでもゲーム攻略メインで投稿されている感じか"),
      think("添付画像にゲーマーIDが写っている"),
      think("今のIDと違うな、前に遊んでいたアカウントってことかな"),
      hideWindow(),
      kaiDm(
        "ryo",
        "ここまでしか調べられなくて、ここから更に深掘りできないものかと考えてる",
        "2026-11-25T23:35:00+09:00",
      ),
      kaiDm(
        "kai",
        "前のアカウントか。名前を変えても、昔の募集に使った名前は残ったりするんだよな。",
        "2026-11-25T23:36:00+09:00",
      ),
      kaiDm(
        "ryo",
        "確かに、募集のときは知らない人にも名前を伝えるもんね。",
        "2026-11-25T23:37:00+09:00",
      ),
      chat(
        "discord:dm-kai",
        "ryo",
        "話せて少し落ち着いた。ありがとう。",
        "2026-11-25T23:37:30+09:00",
        {
          wait: 3000,
        },
      ),
    ],
  },
  {
    id: "ch4-old-account",
    chapter: 4,
    layout: "overlay",
    when: ["s05-old-discord-user"],
    after: ["ch4-leaf"],
    sets: ["toldKaiOldAccount"],
    source: "Google Docs 箱書き 第四章",
    script: [
      narrate("古いアカウント『このモンスターを周回するパーティー組みたいです！』"),
      narrate("ほかの人『参加したいです！』"),
      narrate(
        `古いアカウント『ゲーマーIDは ${characters.maimai.accounts.discordOldId} です！フレンド飛ばしてくれたらロビー招待します！』`,
      ),
      think("画像に写っていたのと、同じIDが書いてある。"),
      narrate("名前の横の丸は灰色のまま。最後の発言からも長い時間が経っている。"),
      chat(
        "discord:dm-kai",
        "ryo",
        "モンハンコミュニティでまいまいの旧アカウント見つけたよ！",
        "2026-11-25T23:40:00+09:00",
      ),
      chat(
        "discord:dm-kai",
        "kai",
        "おお、さすがだな。そこから何か辿れそう？",
        "2026-11-25T23:41:00+09:00",
        { wait: "normal" },
      ),
    ],
  },
  {
    id: "ch4-old-blog",
    chapter: 4,
    layout: "overlay",
    when: ["s06-old-profile-link"],
    after: ["ch4-old-account"],
    source: "Google Docs 箱書き 第四章",
    script: [
      narrate("古いプロフィールにリンクが残っている。"),
      narrate("リンクの先には、記事の見出しが並んでいる。"),
      narrate("攻略の記事のあいだに、日記の見出しもいくつか混ざっている。"),
    ],
  },
  {
    id: "ch4-real-name",
    chapter: 4,
    layout: "overlay",
    when: ["s08-real-name"],
    after: ["ch4-old-blog"],
    source: "Google Docs 箱書き 第四章",
    script: [
      narrate("2018年11月17日。『写真コンテストで賞をもらいました！』とある。"),
      narrate("本文には『優秀賞をもらいました！！』。写真の下には『帰り道』と書いてある。"),
      think("名前が書かれた画面を前にして、少し落ち着かなくなった。"),
      title("……"),
      narrate("記事にはTwixerへのリンクも残っていた。"),
      narrate("Twixerのリンク先は表示されなかった。"),
    ],
  },
  {
    id: "ch4-bff",
    chapter: 4,
    layout: "overlay",
    when: ["foundBff"],
    after: ["ch4-real-name"],
    source: "Google Docs 箱書き 第四章",
    script: [
      narrate(
        "アカウント名が現在は変わって鍵垢になっているが、前に使っていたアカウントらしきものが見つかった。",
      ),
      think("ふむ、プロフィールで『BFF アカウント名』って書かれてる"),
      think("確かBFFってベストフレンドフォーエバーだっけ"),
      narrate("プロフィールのギャラリーに、二人で写った写真が何枚もある。"),
      think("隣の人に向かって笑ってる。僕の知らない顔だ。"),
    ],
  },
];

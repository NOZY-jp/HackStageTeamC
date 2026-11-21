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
      think("leafで検索してみたら案の定見つかった"),
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
        "なるほど……前のアカウントなら、ゲーマーコミュニティーのサーバーでID検索してみるとかはどうだろうね",
        "2026-11-25T23:36:00+09:00",
      ),
      kaiDm(
        "ryo",
        "確かにコミュニティーで良くパーティー募集しているし、ひょっとしたら見つけれるかも",
        "2026-11-25T23:37:00+09:00",
      ),
      chat("discord:dm-kai", "ryo", "ありがとう、その線で探してみる", "2026-11-25T23:37:30+09:00", {
        wait: 3000,
      }),
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
      think("よし、同じIDでメッセージを投稿してるアカウントを見つけたぞ"),
      narrate("アカウントのステータスはずっとオフラインで、長い間運用されていないのが分かる。"),
      think("一応、カイにも見つかったって伝えておこう。"),
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
      narrate("ゲーマーコミュニティーで探りを入れているとある投稿が目についた。"),
      think("このアカウントで古いブログの方が宣伝されているな"),
      think("リンク先は――"),
      narrate("そこにはトップページではなく記事一覧が表示されている。"),
      think("記事一覧からだと1つ1つ記事があるな"),
      narrate("leafへ意図的に移行されなかったであろう記事がそこに残されている。"),
      narrate("写真コンテストについての記事が気になった。"),
      narrate("写真コンテストに出場して受賞したという内容の記事のようだ。"),
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
      think("コンテストで調べてみたら一発で本名出てきた"),
      think("運営のネットリテラシーが気になるけど、おかげで一歩前進したぞ"),
      title("……"),
      narrate("それとブログを探索していたらTwixerのリンクが複数見つかった。"),
      think("Twixerのリンクはあるけど全部リンク切れか"),
      think("どのアカウントで投稿されてるものなんだろう"),
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
      narrate(
        "その友人らしくアカウントのプロフィールを開くとギャラリーにびっしりと写真が投稿されている。",
      ),
      think("でんちゃんかどうか確信が持てないけど、めっちゃ仲よさそうな写真がいっぱいある"),
      think("推測するにでんちゃんのリア友ってところかな"),
    ],
  },
];

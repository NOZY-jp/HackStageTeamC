import type { Scene } from "./types";

/**
 * 台本（試作・文面は仮）。章の順に並べる。配列の順番が再生順になる。
 * - requires: このフラグが全部そろったら始まる
 * - completesFlags: 場面が終わったら立つ
 * - 選択肢の setsFlags: 選んだときだけ立つ
 *
 * 彼女は冒頭から連絡がつかない（進行役はカイだけ）。彼女を話者にしない。
 * カイからの連絡は、コンテスト名で本名が分かった後（real_name_known）に置く。
 * 「でんちゃん」は 旧ブログのコメント欄で見つける → カイに相談する の2段階で届く。
 */
export const scenes: Scene[] = [
  {
    id: "ch1-mylist",
    chapter: "助言",
    title: "マイリストの通知",
    requires: ["mylist_opened"],
    lines: [
      {
        speakerId: "ryo",
        text: "マイリスト、開いてみた。記事は少ないけど、コメントまで残ってた。",
      },
      { speakerId: "ryo", text: "写真の記事、あった。賞をもらったやつだ。" },
    ],
    choices: [
      { id: "remember", label: "覚えてる。見に行く", setsFlags: ["photo_hint"] },
      { id: "later", label: "あとで見る", setsFlags: ["photo_hint"] },
    ],
    completesFlags: [],
  },
  {
    id: "ch2-contest",
    chapter: "痕跡",
    title: "結果ページの名前",
    requires: ["real_name_known"],
    lines: [
      { speakerId: "ryo", text: "結果ページを見た。名前まで載ってるなんて思わなかった。" },
      { speakerId: "ryo", text: "……この名前、どこかで聞いた気がする。" },
    ],
    choices: [
      { id: "see-photo", label: "写真のページを見に行く", setsFlags: [] },
      { id: "keep", label: "自分で調べる", setsFlags: [] },
    ],
    completesFlags: [],
  },
  {
    id: "ch3-kai",
    chapter: "欠片",
    title: "カイからの連絡",
    requires: ["real_name_known"],
    lines: [
      { speakerId: "kai", text: "本名まで辿り着いたんだな。早いじゃん。" },
      { speakerId: "ryo", text: "まだ偶然だよ。写真のページを見つけただけ。" },
      { speakerId: "kai", text: "その写真、撮った場所に心当たりある？" },
    ],
    choices: [
      { id: "ask-kai", label: "カイに相談する", setsFlags: ["denchan_confirmed"] },
      { id: "go", label: "その場所に行ってみる", setsFlags: [] },
    ],
    completesFlags: ["kai_contacted"],
  },
  {
    id: "ch4-kanon",
    chapter: "現実",
    title: "かのんの記憶",
    requires: ["denchan_found", "denchan_confirmed", "photo_hint"],
    lines: [
      { speakerId: "kanon", text: "久しぶり。あの写真、覚えてるよ。" },
      { speakerId: "ryo", text: "あの写真、橋のたもとで撮ったんだよね？" },
      { speakerId: "kanon", text: "うん。今も残ってるかは分からないけど、行ってみたら？" },
    ],
    choices: [{ id: "thanks", label: "ありがとう。行ってみる", setsFlags: [] }],
    completesFlags: [],
  },
];

/** 台本の総場面数（確認画面の進捗表示に使う）。 */
export const sceneCount = scenes.length;

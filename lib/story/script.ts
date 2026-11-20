import type { Scene } from "./types";

/**
 * 台本（試作・文面は仮）。章の順に並べる。配列の順番が再生順になる。
 * - requires: このフラグが全部そろったら始まる
 * - completesFlags: 場面が終わったら立つ
 * - 選択肢の setsFlags: 選んだときだけ立つ
 *
 * カイからの連絡は、コンテスト名で本名が分かった後（real_name_known）に置く。
 */
export const scenes: Scene[] = [
  {
    id: "ch1-mylist",
    chapter: "助言",
    title: "マイリストの通知",
    requires: ["mylist_opened"],
    lines: [
      { speakerId: "mai", text: "マイリスト開いたんだ。あのブログ、まだ残ってた？" },
      { speakerId: "ryo", text: "うん。記事は少ないけど、コメントまで残ってた。" },
      { speakerId: "mai", text: "写真の記事、覚えてる？ 賞をもらったやつ。" },
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
      { speakerId: "mai", text: "結果ページ、見た？ 名前まで載ってるなんて思わなかった。" },
      { speakerId: "ryo", text: "見た。……この名前、どこかで聞いた気がする。" },
      { speakerId: "mai", text: "気のせいじゃない？ 昔の呼び方なら、かのんが知ってるかも。" },
    ],
    choices: [
      { id: "ask-kanon", label: "かのんに聞く", setsFlags: ["kanon_heard"] },
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
      { id: "go", label: "その場所に行ってみる", setsFlags: [] },
      { id: "ask-kanon", label: "かのんにも聞いてみる", setsFlags: ["kanon_heard"] },
    ],
    completesFlags: ["kai_contacted"],
  },
  {
    id: "ch4-kanon",
    chapter: "現実",
    title: "かのんの記憶",
    requires: ["kanon_heard", "photo_hint"],
    lines: [
      { speakerId: "kanon", text: "久しぶり。あの写真、覚えてるよ。" },
      { speakerId: "ryo", text: "橋のたもとで撮ったんでしょ。今も残ってるかは分からないけど。" },
      { speakerId: "kanon", text: "残ってると思う。行ってみたら？" },
    ],
    choices: [{ id: "thanks", label: "ありがとう。行ってみる", setsFlags: [] }],
    completesFlags: [],
  },
];

/** 台本の総場面数（確認画面の進捗表示に使う）。 */
export const sceneCount = scenes.length;

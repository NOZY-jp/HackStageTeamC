import type { Scene } from "./types";

/**
 * 台本（試作・文面は仮）。章の順に並べる。配列の順番が再生順になる。
 * - requires: このフラグが全部そろったら始まる
 * - completesFlags: 場面が終わったら立つ
 * - 選択肢の setsFlags: 選んだときだけ立つ
 */
export const scenes: Scene[] = [
  {
    id: "ch1-mylist",
    chapter: "助言",
    title: "マイリストの通知",
    requires: ["mylist_opened"],
    lines: [
      { speakerId: "kai", text: "マイリスト開いたんだろ。あのブログ、まだ残ってたか。" },
      { speakerId: "ryo", text: "うん。記事は少ないけど、コメントまで残ってた。" },
      { speakerId: "kai", text: "写真の記事、覚えてる？ 賞をもらったやつ。" },
    ],
    choices: [
      { id: "remember", label: "覚えてる。見に行く", setsFlags: ["photo_hint"] },
      { id: "later", label: "あとで見る", setsFlags: ["photo_hint"] },
    ],
    completesFlags: ["kai_contacted"],
  },
  {
    id: "ch1-photo",
    chapter: "助言",
    title: "受賞作の写真",
    requires: ["kai_contacted", "photo_hint"],
    lines: [
      { speakerId: "ryo", text: "賞の写真、夕日のやつだ。タイトルは「帰り道」。" },
      { speakerId: "kai", text: "その写真、撮った場所に心当たりある？" },
      { speakerId: "ryo", text: "橋の向こう……昔、よく通ってた道だ。" },
    ],
    choices: [
      { id: "go", label: "その場所に行ってみる", setsFlags: [] },
      { id: "ask-yui", label: "ゆいに聞いてみる", setsFlags: ["kanon_heard"] },
    ],
    completesFlags: [],
  },
  {
    id: "ch2-contest",
    chapter: "痕跡",
    title: "結果ページの名前",
    requires: ["real_name_known"],
    lines: [
      { speakerId: "yui", text: "結果ページ、見た？ 名前まで載ってるなんて思わなかった。" },
      { speakerId: "ryo", text: "見た。……この名前、どこかで聞いた気がする。" },
      { speakerId: "yui", text: "気のせいじゃない？ 昔の呼び方なら、かのんが知ってるかも。" },
    ],
    choices: [
      { id: "ask-kanon", label: "かのんに聞く", setsFlags: ["kanon_heard"] },
      { id: "keep", label: "自分で調べる", setsFlags: [] },
    ],
    completesFlags: [],
  },
  {
    id: "ch3-call",
    chapter: "欠片",
    title: "かのんの記憶",
    requires: ["kanon_heard", "photo_hint"],
    lines: [
      { speakerId: "kanon", text: "でんちゃん、久しぶり。あの写真、覚えてるよ。" },
      { speakerId: "ryo", text: "その呼び方……。" },
      { speakerId: "kanon", text: "橋のたもとで撮ったんでしょ。今も残ってるかは分からないけど。" },
    ],
    choices: [{ id: "thanks", label: "ありがとう。行ってみる", setsFlags: [] }],
    completesFlags: [],
  },
];

/** 台本の総場面数（確認画面の進捗表示に使う）。 */
export const sceneCount = scenes.length;

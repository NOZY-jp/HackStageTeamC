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
/**
 * 結末の文言（正本: 段階11「住所作成はしない。『住所を特定しました』で終了」）。
 * 住所そのもののデータは作らない。文言はここ1か所だけを正とする。
 */
export const ENDING_ADDRESS_CONFIRMED = "住所を特定しました";

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
      { id: "remember", label: "見に行く", setsFlags: [] },
      { id: "later", label: "あとで見る", setsFlags: [] },
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
      { speakerId: "ryo", text: "……この人が、でんでん？" },
    ],
    choices: [
      { id: "see-photo", label: "かのんの写真を見に行く", setsFlags: ["bff_photos_seen"] },
      // どちらの選択肢でも「写真を見た」ことになり、ch3 へ進める（行き止まりを作らない）
      { id: "keep", label: "自分で調べる", setsFlags: ["bff_photos_seen"] },
    ],
    completesFlags: [],
  },
  {
    id: "ch3-kai",
    chapter: "欠片",
    title: "カイの助言",
    // 順序9: 本名が分かり、かのん（BFF）の写真を見た後に、カイが Facebook を勧める
    requires: ["real_name_known", "bff_photos_seen"],
    lines: [
      { speakerId: "kai", text: "Facebook だと、本名で検索したら結構出てくるぞ？" },
      { speakerId: "ryo", text: "Facebook……そんなの、使ってないけど。" },
      { speakerId: "kai", text: "写真の子と見比べるんだぞ。似てるかどうかだけでもいい。" },
    ],
    choices: [
      // 順序9→10: 本名で検索する（照合は次の場面）
      { id: "search-name", label: "本名で TalkUp を検索する", setsFlags: ["facebook_search"] },
      // 任意: 「でんちゃん」を先に見つけた人だけがカイに相談できる
      {
        id: "ask-kai",
        label: "カイに相談する",
        setsFlags: ["denchan_confirmed"],
        requires: ["denchan_found"],
        // 寄り道: 場面は終わらず、この後「本名で TalkUp を検索する」を選べる
        completesScene: false,
        replyLines: [
          {
            speakerId: "kai",
            text: "その呼び方、本人に言うと喜ぶぞ。『でんちゃん』って呼ばれるのが好きなんだ。",
          },
          { speakerId: "ryo", text: "……そうなんだ。覚えておく。" },
        ],
      },
    ],
    completesFlags: ["kai_contacted"],
  },
  {
    id: "ch4-matching",
    chapter: "現実",
    title: "写真の照合",
    // 順序10→11: 検索で見つけた人と、かのんの写真の人物を照合して終わる
    requires: ["facebook_search"],
    lines: [
      { speakerId: "ryo", text: "かのんの写真の子と、TalkUp で見つけた人は、同じに見える。" },
      {
        speakerId: "ryo",
        text: "プロフィールの出身は神奈川県。……この人だ。間違いない。",
      },
    ],
    // 選択肢なしで完了する場面。終了はこの場面の完了時に出す
    choices: [],
    ending: ENDING_ADDRESS_CONFIRMED,
    completesFlags: [],
  },
];

/** 台本の総場面数（確認画面の進捗表示に使う）。 */
export const sceneCount = scenes.length;

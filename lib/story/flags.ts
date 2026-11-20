import type { StoryFlag, Trigger } from "./types";

/**
 * 進行フラグ。台本の `requires` / `completesFlags` / 選択肢の `setsFlags` は
 * ここのIDだけを使う（整合性テストで検査する）。
 */
export const flags: StoryFlag[] = [
  {
    id: "mylist_opened",
    label: "マイリストを開いた",
    description: "旧ブログのマイリスト（記事一覧）を開いた。",
  },
  {
    id: "real_name_known",
    label: "本名を知った",
    description: "コンテストの結果ページで受賞者の本名を知った。",
  },
  {
    id: "kai_contacted",
    label: "カイから連絡が来た",
    description: "カイが Discord で話しかけてきた。",
  },
  {
    id: "bff_photos_seen",
    label: "かのんの写真を見た",
    description: "BFF のアカウントの写真に、彼女らしい人が写っていた（まだ確信は持てない）。",
  },
  {
    id: "denchan_found",
    label: "「でんちゃん」を見つけた",
    description: "旧ブログのコメント欄に、祖母が一度だけ書いた呼び名が残っていた。",
  },
  {
    id: "denchan_confirmed",
    label: "呼び名の由来を知った",
    description: "カイに相談したら、でんちゃんと呼ぶと喜ぶと助言された。",
  },
  {
    id: "facebook_search",
    label: "本名で TalkUp を検索した",
    description:
      "写真の人物を本名で検索し、住所を特定したところで終わる（住所のデータは作らない）。",
  },
];

/** フラグIDから定義を引く。 */
export function getFlag(id: string): StoryFlag | undefined {
  return flags.find((flag) => flag.id === id);
}

/**
 * きっかけ。各画面に置く部品（#81 では /story のボタン）がこの単位でフラグを立てる。
 */
export const triggers: Trigger[] = [
  {
    id: "open-mylist",
    label: "マイリストを開く",
    description: "旧ブログの記事一覧を開いたことにする。",
    setsFlags: ["mylist_opened"],
  },
  {
    id: "read-contest-result",
    label: "コンテスト結果を見る",
    description: "結果ページで受賞者の本名を見たことにする。",
    setsFlags: ["real_name_known"],
  },
  {
    id: "find-denchan",
    label: "旧ブログのコメント欄を読む",
    description: "祖母が一度だけ書いた「でんちゃん」を見つけたことにする。",
    setsFlags: ["denchan_found"],
  },
];

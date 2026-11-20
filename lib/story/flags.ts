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
    id: "photo_hint",
    label: "写真の手がかり",
    description: "受賞作の写真が、昔のブログの写真と同じだと分かった。",
  },
  {
    id: "kanon_heard",
    label: "かのんに聞いた",
    description: "かのんに昔の呼び方を聞いた。",
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
    id: "ask-kanon",
    label: "かのんに聞く",
    description: "幼なじみに昔の呼び方を聞いたことにする。",
    setsFlags: ["kanon_heard"],
  },
];

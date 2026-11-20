/**
 * Discord で送られる画像の定義（順序4）。
 * 画像の実体はまだ public に置いていない（人の承認後に配置する）。ここでは
 * 「どの画像が誰のIDか」と「public からのパス（1か所の定数）」だけを持つ。
 *
 * 人の決定（2026-11-20）: 順序4の向きは原文どおり
 * - Discord で送られたスクショ = 現在のID `maimaimaimai`
 * - 旧ブログの添付画像 = 旧ID `hunter_denden`（@hunter_denden0102）
 */

/** 旧 Twixer のハンドル（旧ブログ側の画像に写っているID）。 */
export const OLD_TWIXER_HANDLE = "hunter_denden0102";

export type MessageImageOwner = "current" | "old";

export type MessageImage = {
  /** 画像のファイル名（MessageAttachment.name と一致させる） */
  name: string;
  /** 写っているアカウント: 現在 or 旧 */
  owner: MessageImageOwner;
  /** 写っているハンドル（@ なし） */
  handle: string;
  /** public からの実体パス。実体は承認後に置く */
  src: string;
  width: number;
  height: number;
  /** 画面に出す短い説明（画像が出せないときのプレースホルダにも使う） */
  label: string;
};

/** Discord の画像（キーはファイル名）。実体の有無に関係なくここだけで解決する。 */
export const MESSAGE_IMAGES: Record<string, MessageImage> = {
  "screenshot-2026.png": {
    name: "screenshot-2026.png",
    owner: "current",
    handle: "maimaimaimai",
    src: "/mock/screenshot-2026.png",
    width: 800,
    height: 600,
    label: "今のアカウントのスクリーンショット",
  },
  "screenshot-2019.svg": {
    name: "screenshot-2019.svg",
    owner: "old",
    handle: OLD_TWIXER_HANDLE,
    src: "/mock/screenshot-2019.svg",
    width: 800,
    height: 600,
    label: "当時のアカウントのスクリーンショット",
  },
};

/** 画像名から定義を引く。未定義の名前はパスだけ組み立てる（プレースホルダ表示になる）。 */
export function getMessageImage(name: string): MessageImage {
  return (
    MESSAGE_IMAGES[name] ?? {
      name,
      owner: "current",
      handle: "",
      src: `/mock/${name}`,
      width: 800,
      height: 800,
      label: name,
    }
  );
}

/**
 * Discord で送られる画像の定義（順序4）。
 * 画像の実体は `public/discord-like/` に置いてある。ここでは
 * 「どの画像が誰のIDか」と「public からのパス（1か所の定数）」を持つ。
 *
 * 人の決定（2026-11-20）: 順序4の向きは原文どおり
 * - Discord で送られたスクショ = 現在のID `maimaimaimai`
 * - 旧ブログの添付画像 = 旧ゲーマーID `hunter_denden3243`
 *   （Twixer の旧ハンドル `@hunter_denden0102` とは別物）
 */

/**
 * 旧アカウントのゲーマーID（Discord の旧垢。段階5の「完全一致」対象）。
 * Twixer の旧ハンドル @hunter_denden0102 とは別物。
 */
export const OLD_GAMER_ID = "hunter_denden3243";

export type MessageImageOwner = "current" | "old" | "unknown";

export type MessageImage = {
  /** 画像のファイル名（MessageAttachment.name と一致させる） */
  name: string;
  /**
   * ready = 実体が public にある / pending = まだ置いていない。
   * pending のあいだは <Image> を描かない（404 のリクエストを出さない）。
   */
  status: "ready" | "pending";
  /** 写っているアカウント: 現在 or 旧 */
  owner: MessageImageOwner;
  /** 写っているハンドル（@ なし） */
  handle: string;
  /** public からの実体パス（実体は `public/discord-like/` に置く） */
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
    status: "ready",
    owner: "current",
    handle: "maimaimaimai",
    src: "/discord-like/screenshot-2026-friends.png",
    width: 800,
    height: 600,
    label: "今のアカウントのスクリーンショット",
  },
  "screenshot-2018.png": {
    name: "screenshot-2018.png",
    status: "ready",
    owner: "old",
    handle: OLD_GAMER_ID,
    src: "/discord-like/screenshot-2018-game.png",
    width: 1200,
    height: 675,
    label: "2018年の狩猟画面のスクリーンショット",
  },
};

/** 画像名から定義を引く。未定義の名前はパスだけ組み立てる（プレースホルダ表示になる）。 */
export function getMessageImage(name: string): MessageImage {
  return (
    MESSAGE_IMAGES[name] ?? {
      name,
      // 定義が無い画像は実体も不明なので、リクエストを出さずプレースホルダにする
      status: "pending",
      owner: "unknown",
      handle: "",
      src: `/mock/${name}`,
      width: 800,
      height: 800,
      label: name,
    }
  );
}

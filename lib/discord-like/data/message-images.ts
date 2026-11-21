/**
 * Discord で送られる画像の定義（順序4）。
 * 画像の実体は `public/discord-like/` に置いてある。ここでは
 * 「どの画像が誰のIDか」と「public からのパス（1か所の定数）」を持つ。
 *
 * `public/discord-like/` は Discord 専用のディレクトリではなく、**旧ブログの記事（#101）とも共有**している
 * （同じ撮影画像を2か所に複製しないため。例: `screenshot-2018-game.png` はブログの証拠画像でもある）。
 * 新しい画像を置くときは、他プラットフォームから参照されていないかをここで確認する。
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
  // #clips の動画サムネイル相当（mhc.ts の添付名は .png のまま、実体は WebP）
  "clip-0312-2.png": {
    name: "clip-0312-2.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0312-2.webp",
    width: 1200,
    height: 675,
    label: "夕暮れの渓谷と吊り橋",
  },
  // #clips の生成画像（manual/README.md の表の「情景」をそのまま label に使う）
  "clip-0211-1.png": {
    name: "clip-0211-1.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0211-1.webp",
    width: 1200,
    height: 675,
    label: "夜の紅葉の谷",
  },
  "clip-0312-3.png": {
    name: "clip-0312-3.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0312-3.webp",
    width: 1200,
    height: 675,
    label: "夜のフィールドで交戦中",
  },
  "clip-0318-4.png": {
    name: "clip-0318-4.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0318-4.webp",
    width: 1200,
    height: 675,
    label: "支援の光が消える瞬間",
  },
  "clip-0418-5.png": {
    name: "clip-0418-5.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0418-5.webp",
    width: 1200,
    height: 675,
    label: "誰もいない広いフィールド",
  },
  "clip-0529-6.png": {
    name: "clip-0529-6.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0529-6.webp",
    width: 1200,
    height: 675,
    label: "初めて見る大型モンスター",
  },
  "clip-0529-7.png": {
    name: "clip-0529-7.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0529-7.webp",
    width: 1200,
    height: 675,
    label: "大盾で突っ張る",
  },
  "clip-0602-1.png": {
    name: "clip-0602-1.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0602-1.webp",
    width: 1200,
    height: 675,
    label: "4人そろって決まった瞬間",
  },
  "clip-0613-2.png": {
    name: "clip-0613-2.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0613-2.webp",
    width: 1200,
    height: 675,
    label: "拠点（集会所）の入口",
  },
  "clip-0619-3.png": {
    name: "clip-0619-3.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0619-3.webp",
    width: 1200,
    height: 675,
    label: "失敗した現場",
  },
  "clip-0715-4.png": {
    name: "clip-0715-4.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0715-4.webp",
    width: 1200,
    height: 675,
    label: "落ち葉の森を歩く後ろ姿",
  },
  "clip-1019-5.png": {
    name: "clip-1019-5.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-1019-5.webp",
    width: 1200,
    height: 675,
    label: "崖っぷちの危ない足場",
  },
  "clip-1102-6.png": {
    name: "clip-1102-6.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-1102-6.webp",
    width: 1200,
    height: 675,
    label: "弓を構えた瞬間",
  },
  "clip-1208-7.png": {
    name: "clip-1208-7.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-1208-7.webp",
    width: 1200,
    height: 675,
    label: "回復の光が当たる",
  },
  "clip-0204-8.png": {
    name: "clip-0204-8.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0204-8.webp",
    width: 1200,
    height: 675,
    label: "とどめの一撃",
  },
  "clip-0214-9.png": {
    name: "clip-0214-9.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0214-9.webp",
    width: 1200,
    height: 675,
    label: "盾でガードした瞬間",
  },
  "clip-0425-1.png": {
    name: "clip-0425-1.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0425-1.webp",
    width: 1200,
    height: 675,
    label: "夜明けのフィールド",
  },
  "clip-0617-1.png": {
    name: "clip-0617-1.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0617-1.webp",
    width: 1200,
    height: 675,
    label: "採取ポイント",
  },
  "clip-0617-2.png": {
    name: "clip-0617-2.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0617-2.webp",
    width: 1200,
    height: 675,
    label: "拠点で反省会",
  },
  "clip-0617-3.png": {
    name: "clip-0617-3.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0617-3.webp",
    width: 1200,
    height: 675,
    label: "失敗のあとの景色",
  },
  "clip-0626-4.png": {
    name: "clip-0626-4.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0626-4.webp",
    width: 1200,
    height: 675,
    label: "定点から見た地形",
  },
  "clip-0724-5.png": {
    name: "clip-0724-5.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0724-5.webp",
    width: 1200,
    height: 675,
    label: "素の画面（手を加えない）",
  },
  "clip-0819-1.png": {
    name: "clip-0819-1.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0819-1.webp",
    width: 1200,
    height: 675,
    label: "紫に染まった夜の景色",
  },
  "clip-0820-2.png": {
    name: "clip-0820-2.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0820-2.webp",
    width: 1200,
    height: 675,
    label: "月夜の草原",
  },
  "clip-0826-3.png": {
    name: "clip-0826-3.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0826-3.webp",
    width: 1200,
    height: 675,
    label: "高所からの眺め",
  },
  "clip-0905-1.png": {
    name: "clip-0905-1.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0905-1.webp",
    width: 1200,
    height: 675,
    label: "囲まれた状況",
  },
  "clip-0920-2.png": {
    name: "clip-0920-2.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0920-2.webp",
    width: 1200,
    height: 675,
    label: "絶景",
  },
  "clip-0922-3.png": {
    name: "clip-0922-3.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-0922-3.webp",
    width: 1200,
    height: 675,
    label: "4人のハンター",
  },
  "clip-1004-4.png": {
    name: "clip-1004-4.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-1004-4.webp",
    width: 1200,
    height: 675,
    label: "ローアングルの景色",
  },
  "clip-1025-5.png": {
    name: "clip-1025-5.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-1025-5.webp",
    width: 1200,
    height: 675,
    label: "大技の瞬間",
  },
  "clip-1103-6.png": {
    name: "clip-1103-6.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-1103-6.webp",
    width: 1200,
    height: 675,
    label: "光る素材（ドロップ）",
  },
  "clip-1109-7.png": {
    name: "clip-1109-7.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-1109-7.webp",
    width: 1200,
    height: 675,
    label: "鎌を持つ大型モンスター",
  },
  "clip-1117-8.png": {
    name: "clip-1117-8.png",
    status: "ready",
    owner: "unknown",
    handle: "",
    src: "/discord-like/clips/clip-1117-8.webp",
    width: 1200,
    height: 675,
    label: "新装備の立ち姿",
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

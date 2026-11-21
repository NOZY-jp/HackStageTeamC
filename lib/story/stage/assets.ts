import type { CharacterId } from "../types";

/**
 * 背景・立ち絵・小物の一覧（統一するもの）。場面からは名前で指定する。
 * src が無いものは、画面に名前入りの仮の板を出す。画像を用意したら public/story/ に置いて src を書く。
 * 新しく足すときは、ここに1行足す（型で打ち間違いを防ぐ）。
 */
export type Asset = {
  label: string;
  /** public からのパス（例: "/story/backgrounds/room-night.webp"）。未用意なら無し */
  src?: string;
  /** 仮の板の色（画像が無いとき） */
  color: string;
  /** 画像を使わない、ただの色の背景（暗転など）。仮の板の名前を出さない */
  solid?: boolean;
};

export const BACKGROUNDS = {
  "room-night": { label: "リョウの部屋（夜）", color: "#1d2440" },
  "room-day": { label: "リョウの部屋（昼）", color: "#8fa6c0" },
  "pc-screen": { label: "PCの画面", color: "#10131c" },
  station: {
    label: "駅前（待ち合わせ・着いたとき）",
    src: "/story/backgrounds/station-arrival.webp",
    color: "#c9b79c",
  },
  "station-dusk": {
    label: "駅前（待ち合わせ・夕方）",
    src: "/story/backgrounds/station-dusk.webp",
    color: "#d08a6a",
  },
  "sweets-shop": {
    label: "地元の洋菓子店",
    src: "/story/backgrounds/sweets-shop.webp",
    color: "#a9825f",
  },
  "manhole-street": {
    label: "マンホールのある住宅街",
    src: "/story/backgrounds/manhole-street.webp",
    color: "#7d6a78",
  },
  cafe: { label: "喫茶店", color: "#a9825f" },
  street: { label: "住宅街", color: "#7d8a74" },
  black: { label: "暗転", color: "#000000", solid: true },
} as const satisfies Record<string, Asset>;
export type BackgroundId = keyof typeof BACKGROUNDS;

/** 立ち絵の表情（全人物で共通の名前） */
export const EXPRESSIONS = {
  normal: "ふつう",
  smile: "笑顔",
  worried: "心配",
  surprised: "驚き",
  sad: "悲しい",
  angry: "怒り",
  thinking: "考え中",
} as const;
export type Expression = keyof typeof EXPRESSIONS;

/** 人物ごとの立ち絵。src は表情ごと（未用意なら仮の板） */
export const SPRITES: Record<
  CharacterId,
  { color: string; src?: Partial<Record<Expression, string>> }
> = {
  ryo: { color: "#e3a65c" },
  maimai: { color: "#c98bb0" },
  kai: { color: "#5e7fc9" },
  kanon: { color: "#7fb39a" },
};

/** 小物（スマホ・スクショ・手紙など）。立ち絵と同じ命令で出し入れする */
export const PROPS = {
  smartphone: { label: "スマホ", color: "#2b2f45" },
  screenshot: { label: "スクショ", color: "#3a5a7a" },
  letter: { label: "手紙", color: "#efe3c8" },
  photo: { label: "写真", color: "#d8c7b0" },
} as const satisfies Record<string, Asset>;
export type PropId = keyof typeof PROPS;

/** 立ち絵・小物の指定 */
export type ImageRef =
  | { character: CharacterId; expression?: Expression }
  | { prop: PropId }
  /** 一覧に無い画像を直接使う（自由に書くとき） */
  | { src: string; label: string };

export function imageLabel(image: ImageRef): string {
  if ("character" in image) {
    return `${image.character}（${EXPRESSIONS[image.expression ?? "normal"]}）`;
  }
  if ("prop" in image) {
    return PROPS[image.prop].label;
  }
  return image.label;
}

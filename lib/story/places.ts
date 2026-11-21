import { APP_PREFIX, dmListPath, dmThreadPath, guildChannelPath } from "@/lib/platform/app-prefix";

/**
 * 物語の場面が起きる画面。場面に `place` を書くと、その画面を開いたときに始まる
 * （開いていなければ、画面の右下に「◯◯を開く」と案内だけ出す。勝手に画面は移さない）。
 * チャットの命令（chat）も、どの画面に流れるかをここで決める。
 *
 * URL は lib/platform/app-prefix.ts の関数で作る（各プラットフォームの名前空間は import しない・#76）。
 * URL の数値 ID は lib/discord-like/data と同じ値（progression.test.ts で突き合わせる）。
 */
export const MAIMAI_DM_URL_ID = "1187002356428841501";
export const KAI_DM_URL_ID = "1187002356428841502";
/**
 * 段階1の手がかりになるメッセージ（MaiMai が「攻略ブログまで書いてた」と話す発言）。
 * このメッセージが画面に見えた＝プレイヤーが確認した、として s01-blog-talk を立てる。
 * ID は lib/discord-like/data/messages/dm.ts と同じ値（progression.test.ts で突き合わせる）。
 */
export const BLOG_TALK_MESSAGE_ID = "dm-maimai-0060";
/** True End 手がかり1: カイとのDMで「でんちゃん」を勧める発言のID（lib/discord-like/data/messages/dm.ts と一致） */
export const KAI_NICKNAME_ADVICE_MESSAGE_ID = "dm-kai-nickname-advice";
/** モンハンコミュニティ（サーバー）と、そのボイスチャンネル「深夜の集会」 */
export const MHC_GUILD_URL_ID = "1187002356428840961";
export const NIGHT_VC_URL_ID = "1187002356428840973";

export type Place = {
  /** 案内に出す名前（「Discord を開く」の「Discord」） */
  label: string;
  /** 案内のリンク先 */
  href: string;
  /** この接頭辞で始まる URL を開いていれば、その画面にいるとみなす */
  match: string;
  /**
   * 場面が始まったあとは、この接頭辞の中なら移っても続ける（通話しながら Discord の別のチャンネルを見る、など）。
   * 無ければ match の外に出たら窓を隠し、「◯◯を開く」の案内にする
   */
  within?: string;
};

export const PLACES = {
  discord: { label: "Discord", href: dmListPath(), match: `/${APP_PREFIX}/` },
  "discord:dm-maimai": {
    label: "MaiMai との DM",
    href: dmThreadPath(MAIMAI_DM_URL_ID),
    match: dmThreadPath(MAIMAI_DM_URL_ID),
  },
  "discord:dm-kai": {
    label: "カイとのDM",
    href: dmThreadPath(KAI_DM_URL_ID),
    match: dmThreadPath(KAI_DM_URL_ID),
  },
  "discord:vc-night": {
    label: "Discord の「深夜の集会」",
    href: guildChannelPath(MHC_GUILD_URL_ID, NIGHT_VC_URL_ID),
    match: guildChannelPath(MHC_GUILD_URL_ID, NIGHT_VC_URL_ID),
    within: `/${APP_PREFIX}/`,
  },
} as const satisfies Record<string, Place>;

export type PlaceId = keyof typeof PLACES;

/**
 * URL の表記ゆれを1か所でそろえる（#190）。
 * 動的セグメントは `@me` が `%40me` のまま渡ることがあり、末尾スラッシュや大文字小文字でも
 * 同じ画面かどうかの判定が割れる。デコードしてから比較する。
 */
export function normalizePathname(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // 壊れた % はそのまま比べる（判定できないだけで、落とさない）
  }
  return decoded.replace(/\/+$/, "").toLowerCase();
}

function startsWithPath(pathname: string, prefix: string): boolean {
  const path = normalizePathname(pathname);
  const base = normalizePathname(prefix);
  return path === base || path.startsWith(`${base}/`);
}

/** いま開いている URL が、その画面か */
export function isAtPlace(pathname: string, place: PlaceId): boolean {
  return startsWithPath(pathname, PLACES[place].match);
}

/** 場面が始まったあと、続けてよい範囲にいるか（within が無ければ isAtPlace と同じ） */
export function isWithinPlace(pathname: string, place: PlaceId): boolean {
  const target: Place = PLACES[place];
  return (
    isAtPlace(pathname, place) || (target.within ? startsWithPath(pathname, target.within) : false)
  );
}

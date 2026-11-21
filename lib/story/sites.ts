import { APP_PREFIX, dmListPath } from "@/lib/platform/app-prefix";
import type { FlagId } from "./flags";

/**
 * ゲームの中のサイト（プラットフォーム）と、それを「ブックマーク」に開放する条件。
 * 物語や謎解きの段階が進むと、行けるサイトが増える（ブックマークの列に並ぶ）。
 * ただし締め出しはしない。URL や検索でたどり着けたら、そのサイトはその時点で開放する。
 *
 * 旧ブログの ID は lib/blog-like/data と同じ値（progression.test.ts で突き合わせる）。
 */
export const OLD_BLOG_ID = "denden0102";

export type Site = {
  /** ブックマークに出す名前 */
  label: string;
  /** ブックマークのリンク先 */
  href: string;
  /** この接頭辞で始まる URL を開いていれば、そのサイトにいるとみなす */
  match: string;
  /** このフラグが全部そろったら開放する（空ならはじめから開いている） */
  unlockWith: FlagId[];
};

export const SITES = {
  discord: { label: "Discord", href: dmListPath(), match: `/${APP_PREFIX}/`, unlockWith: [] },
  // 第三章: カイに「他のプラットフォームで調べてみたら」と言われる（段階1）
  twixer: { label: "Twixer", href: "/twitter", match: "/twitter", unlockWith: ["s01-blog-talk"] },
  // 段階2: Twixer の手がかりを確認し、ブログを検索できるようになる
  seek: { label: "Seek", href: "/search", match: "/search", unlockWith: ["s02-bff-reply"] },
  // 段階3: ブログ名と概要が結びついて、閉鎖したブログが見つかる
  oldBlog: {
    label: "でんでんの狩猟日記",
    href: `/pochiblo/${OLD_BLOG_ID}`,
    match: "/pochiblo",
    unlockWith: ["s03-blog-found"],
  },
  // 段階3: 閉鎖のお知らせに「leaf に移行しました」とある
  leaf: { label: "leaf", href: "/note", match: "/note", unlockWith: ["s03-blog-found"] },
  // 段階9: カイに「本名で検索したら結構出てくるぞ？」と言われる
  talkup: { label: "talkup", href: "/talkup", match: "/talkup", unlockWith: ["s09-kai-contact"] },
} as const satisfies Record<string, Site>;

export type SiteId = keyof typeof SITES;

/** ブックマークに並べる順（開放される順） */
export const SITE_IDS = Object.keys(SITES) as SiteId[];

function startsWithPath(pathname: string, prefix: string): boolean {
  const base = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** いま開いている URL がどのサイトか */
export function siteAt(pathname: string): SiteId | undefined {
  return SITE_IDS.find((id) => startsWithPath(pathname, SITES[id].match));
}

/** 開放したサイト（条件のフラグがそろった・実際に開いた）。ブックマークに並べる順 */
export function unlockedSites(flags: readonly FlagId[], visited: readonly SiteId[]): SiteId[] {
  return SITE_IDS.filter(
    (id) =>
      visited.includes(id) ||
      (SITES[id].unlockWith as readonly FlagId[]).every((flag) => flags.includes(flag)),
  );
}

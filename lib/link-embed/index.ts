import {
  BLOG_SERVICE_NAME,
  externalHref,
  getBlog,
  getEntry,
  getMylist,
  listMylistEntries,
} from "@/lib/blog-like";
import {
  getChannelByUrlId,
  getDMThreadByUrlId,
  getGuildByUrlId,
  getUser,
} from "@/lib/discord-like";
import {
  getPostById as getFbPostById,
  getUserByHandle as getFbUserByHandle,
  getUserById as getFbUserById,
} from "@/lib/facebook-like";
import { getArticle, getCreator, SERVICE_NAME as LEAF_SERVICE_NAME } from "@/lib/note-like";
import { APP_PREFIX } from "@/lib/platform/app-prefix";
import {
  getPost,
  getProfile,
  getUser as getTwitterUser,
  getUserByHandle as getTwitterUserByHandle,
} from "@/lib/twitter-like";
import { extractLinkCandidates } from "./candidates";
import type { LinkEmbed } from "./types";

export { extractLinkCandidates } from "./candidates";
export type { LinkEmbed } from "./types";

/**
 * メッセージ本文のURLをアプリ内の埋め込みカードに解決する（サーバー側だけで使う。
 * クライアントは _actions/link-embed 経由で呼ぶ。データ層をバンドルに入れないため）。
 *
 * 対象は「アプリ内パスに正規化できて、そのパスのページが実在する」URL。
 * それ以外（外部サイト・存在しないページ）は undefined を返し、本文のテキストのままにする。
 */

/** 作中サイトのイメージカラー（globals.css の各プラットフォームのアクセント色に合わせる） */
const ACCENT = {
  twixer: "#1d9bf0",
  pochiblo: "#f08a3c",
  leaf: "#24786e",
  talkup: "#7c3aed",
  discord: "#4752c4",
} as const;

/**
 * 本文に出たURL候補をアプリ内パスに正規化する。
 * - "/..." のアプリ内パス → そのまま
 * - 作中ドメイン（twixer.com / leaf.jp / pochiblo.jp / discord.com）→ 対応するアプリ内パス
 * - それ以外の http(s) URL → パス部分だけ見る（このアプリのデプロイURLをそのまま貼った場合を拾うため。
 *   パスがアプリ内ルートに当たらなければ後続の解決で弾かれる）
 */
export function normalizeAppPath(candidate: string): string | undefined {
  const strip = (path: string) => path.replace(/\/+$/, "") || "/";
  if (candidate.startsWith("/")) return strip(candidate);
  // twixer.com / leaf.jp は blog-like/url.ts が作中URL→アプリ内パスの対応を持っている
  const fiction = externalHref(candidate.split(/[?#]/)[0]);
  if (fiction) return strip(fiction);
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return undefined;
  }
  const path = strip(url.pathname);
  switch (url.hostname.toLowerCase()) {
    case "pochiblo.jp":
      return path === "/" ? "/pochiblo" : `/pochiblo${path}`;
    case APP_PREFIX:
      return `/${APP_PREFIX}${path === "/" ? "" : path}`;
    default:
      return path;
  }
}

const idOf = (path: string, pattern: RegExp): string | undefined => pattern.exec(path)?.[1];

function resolveTwixer(path: string): LinkEmbed | undefined {
  const postId = idOf(path, /^\/twitter\/post\/([\w-]+)$/);
  if (postId !== undefined) {
    const post = getPost(postId);
    if (!post) return undefined;
    const author = getTwitterUser(post.authorId);
    const media = post.media?.[0];
    return {
      href: `/twitter/post/${post.id}`,
      siteName: "Twixer",
      title: author ? `${author.displayName}（@${author.handle}）` : "投稿",
      description: post.body,
      accentColor: ACCENT.twixer,
      thumbnail: media
        ? { src: media.src, alt: media.alt, width: media.width, height: media.height }
        : undefined,
    };
  }
  const handle = idOf(path, /^\/twitter\/profile\/([\w-]+)$/);
  if (handle !== undefined) {
    const user = getTwitterUserByHandle(handle);
    if (!user) return undefined;
    return {
      href: `/twitter/profile/${user.handle}`,
      siteName: "Twixer",
      title: `${user.displayName}（@${user.handle}）`,
      description: getProfile(user.id)?.bio,
      accentColor: ACCENT.twixer,
    };
  }
  return undefined;
}

function resolvePochiblo(path: string): LinkEmbed | undefined {
  const entry = /^\/pochiblo\/([\w-]+)\/entry\/([\w-]+)$/.exec(path);
  if (entry) {
    const post = getEntry(entry[1], entry[2]);
    if (!post) return undefined;
    const lead = post.body.find((block) => block.kind === "paragraph");
    return {
      href: path,
      siteName: BLOG_SERVICE_NAME,
      title: post.title,
      description: lead && "text" in lead ? lead.text : undefined,
      accentColor: ACCENT.pochiblo,
    };
  }
  const mylistId = idOf(path, /^\/pochiblo\/mylist\/([\w-]+)$/);
  if (mylistId !== undefined) {
    const mylist = getMylist(mylistId);
    if (!mylist) return undefined;
    return {
      href: path,
      siteName: BLOG_SERVICE_NAME,
      title: mylist.title,
      description: `記事一覧（${listMylistEntries(mylist).length}件）`,
      accentColor: ACCENT.pochiblo,
    };
  }
  const blogId = idOf(path, /^\/pochiblo\/([\w-]+)$/);
  if (blogId !== undefined) {
    const blog = getBlog(blogId);
    if (!blog) return undefined;
    return {
      href: path,
      siteName: BLOG_SERVICE_NAME,
      title: blog.title,
      description: blog.description,
      accentColor: ACCENT.pochiblo,
    };
  }
  return undefined;
}

function resolveLeaf(path: string): LinkEmbed | undefined {
  const article = /^\/note\/([\w-]+)\/n\/([\w-]+)$/.exec(path);
  if (article) {
    const target = getArticle(article[1], article[2]);
    if (!target) return undefined;
    return {
      href: path,
      siteName: LEAF_SERVICE_NAME,
      title: target.title,
      description: target.excerpt,
      accentColor: ACCENT.leaf,
      thumbnail: target.cover
        ? { src: target.cover, alt: target.title, width: 760, height: 400 }
        : undefined,
    };
  }
  const creatorId = idOf(path, /^\/note\/([\w-]+)$/);
  if (creatorId !== undefined) {
    const creator = getCreator(creatorId);
    if (!creator) return undefined;
    return {
      href: path,
      siteName: LEAF_SERVICE_NAME,
      title: creator.displayName,
      description: creator.bio,
      accentColor: ACCENT.leaf,
      thumbnail: creator.avatar
        ? { src: creator.avatar, alt: creator.displayName, width: 200, height: 200 }
        : undefined,
    };
  }
  return undefined;
}

function resolveTalkup(path: string): LinkEmbed | undefined {
  const postId = idOf(path, /^\/talkup\/post\/([\w-]+)$/);
  if (postId !== undefined) {
    const post = getFbPostById(postId);
    if (!post) return undefined;
    const author = getFbUserById(post.authorId);
    const photo = post.attachment?.kind === "photo" ? post.attachment : undefined;
    return {
      href: path,
      siteName: "talkup",
      title: author?.displayName ?? "投稿",
      description: post.body,
      accentColor: ACCENT.talkup,
      thumbnail:
        photo?.src && photo.width && photo.height
          ? {
              src: photo.src,
              alt: photo.alt ?? photo.title,
              width: photo.width,
              height: photo.height,
            }
          : undefined,
    };
  }
  const handle = idOf(path, /^\/talkup\/profile\/([\w-]+)$/);
  if (handle !== undefined) {
    const user = getFbUserByHandle(handle);
    if (!user) return undefined;
    return {
      href: path,
      siteName: "talkup",
      title: user.displayName,
      description: user.bio,
      accentColor: ACCENT.talkup,
    };
  }
  return undefined;
}

/** DM の相手側のユーザー（self-user.ts の SELF_USER_ID と同じ id を除く） */
const DISCORD_SELF_ID = "hal";

function resolveDiscord(path: string): LinkEmbed | undefined {
  const base = `\\/${APP_PREFIX}\\/channels`;
  const dm = new RegExp(`^${base}\\/@me\\/([\\w-]+)$`).exec(path);
  if (dm) {
    const thread = getDMThreadByUrlId(dm[1]);
    if (!thread) return undefined;
    const partnerId = thread.participantIds.find((id) => id !== DISCORD_SELF_ID);
    const partner = partnerId ? getUser(partnerId) : undefined;
    return {
      href: path,
      siteName: "Discord",
      title: partner ? `${partner.displayName} とのDM` : "DM",
      accentColor: ACCENT.discord,
    };
  }
  const channel = new RegExp(`^${base}\\/(\\w+)\\/([\\w-]+)$`).exec(path);
  if (channel) {
    const guild = getGuildByUrlId(channel[1]);
    const target = getChannelByUrlId(channel[2]);
    if (!guild || !target) return undefined;
    return {
      href: path,
      siteName: guild.name,
      title: `#${target.name}`,
      description: target.topic,
      accentColor: ACCENT.discord,
    };
  }
  return undefined;
}

/**
 * アプリ内パス → 埋め込みの解決関数。新しい種類の画面を足すときはここに並べる。
 * 先に当たったものを採用するので、重なりうるパターンは具体的なものを先に。
 */
const ROUTE_RESOLVERS: ((path: string) => LinkEmbed | undefined)[] = [
  resolveTwixer,
  resolvePochiblo,
  resolveLeaf,
  resolveTalkup,
  resolveDiscord,
];

/**
 * 本文中のURLのうちアプリ内ページに解決できたもののカード情報。
 * 本文に出た順に、同じリンク先は1件だけ。上限は Discord と同じく少数に絞る。
 */
export function resolveLinkEmbeds(body: string, limit = 3): LinkEmbed[] {
  const embeds: LinkEmbed[] = [];
  const seen = new Set<string>();
  for (const candidate of extractLinkCandidates(body)) {
    const path = normalizeAppPath(candidate);
    if (!path) continue;
    for (const resolve of ROUTE_RESOLVERS) {
      const embed = resolve(path);
      if (!embed) continue;
      if (!seen.has(embed.href)) {
        seen.add(embed.href);
        embeds.push(embed);
      }
      break;
    }
    if (embeds.length >= limit) break;
  }
  return embeds;
}

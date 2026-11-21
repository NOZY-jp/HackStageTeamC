import { APP_PREFIX, dmListPath } from "@/lib/platform/app-prefix";

/**
 * アプリ内の Next.js ルートと作中ブラウザのアドレスバー表示 URL の双方向変換。
 * - `/${APP_PREFIX}/...` <-> `discord.com/...`
 * - `/twitter...` <-> `twixer.com/...`
 * - `/pochiblo/...` <-> `pochiblo.jp/...`
 * - `/note...` <-> `leaf.jp/...`
 * - `/talkup...` <-> `talkup.jp/...`
 * - `/search` <-> `seek.jp`
 */

const DISCORD_HOST = "discord.com";
const TWIXER_HOST = "twixer.com";
const POCHIBLO_HOST = "pochiblo.jp";
const LEAF_HOST = "leaf.jp";
const TALKUP_HOST = "talkup.jp";
const SEEK_HOST = "seek.jp";

const TWITTER_RESERVED_ROOTS = new Set(["search", "messages", "post", "profile"]);

function startsWithPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * アドレスバー表示用にクエリの1要素を組み立てる。
 * 日本語などは読めるまま残し、URL の区切りとして解釈が変わる文字（`#`・`+`・`&`・`=` など）は
 * 必ずパーセントエンコードする。表示した URL をそのまま再送信しても検索語が変わらないようにするため。
 */
const QUERY_SAFE_ASCII = /^[A-Za-z0-9\-._~!$'()*,;:@/]$/;

function encodeQueryPart(value: string): string {
  let encoded = "";
  for (const char of value) {
    if ((char.codePointAt(0) ?? 0) >= 0x80 || QUERY_SAFE_ASCII.test(char)) {
      encoded += char;
    } else {
      encoded += encodeURIComponent(char);
    }
  }
  return encoded;
}

function formatReadableQuery(search?: string): string {
  if (!search) {
    return "";
  }
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) {
    return "";
  }
  const params = new URLSearchParams(raw);
  const parts: string[] = [];
  for (const [key, value] of params.entries()) {
    parts.push(`${encodeQueryPart(key)}=${encodeQueryPart(value)}`);
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

function joinHostPath(host: string, subPath: string, query: string): string {
  const cleanSub = subPath.replace(/\/+$/, "");
  if (!cleanSub) {
    return query ? `${host}/${query}` : host;
  }
  return `${host}${cleanSub}${query}`;
}

/** 内部ルート（pathname + 任意 search）を作中 URL に変換する。 */
export function toDisplayUrl(pathname: string, search?: string): string {
  const cleanPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const query = formatReadableQuery(search);
  const discordPrefix = `/${APP_PREFIX}`;

  if (startsWithPrefix(cleanPath, discordPrefix)) {
    const rest = cleanPath.slice(discordPrefix.length).replace(/%40/gi, "@");
    return joinHostPath(DISCORD_HOST, rest, query);
  }

  if (startsWithPrefix(cleanPath, "/twitter")) {
    const rest = cleanPath.slice("/twitter".length);
    if (rest.startsWith("/profile/")) {
      const profileRest = rest.slice("/profile".length);
      return joinHostPath(TWIXER_HOST, profileRest, query);
    }
    return joinHostPath(TWIXER_HOST, rest, query);
  }

  if (startsWithPrefix(cleanPath, "/pochiblo")) {
    const rest = cleanPath.slice("/pochiblo".length);
    return joinHostPath(POCHIBLO_HOST, rest, query);
  }

  if (startsWithPrefix(cleanPath, "/note")) {
    const rest = cleanPath.slice("/note".length);
    return joinHostPath(LEAF_HOST, rest, query);
  }

  if (startsWithPrefix(cleanPath, "/talkup")) {
    const rest = cleanPath.slice("/talkup".length);
    return joinHostPath(TALKUP_HOST, rest, query);
  }

  if (startsWithPrefix(cleanPath, "/search")) {
    const rest = cleanPath.slice("/search".length);
    return joinHostPath(SEEK_HOST, rest, query);
  }

  return `${cleanPath}${query}`;
}

function resolveTwixerPath(subPath: string, search: string): string {
  const clean = subPath.replace(/\/+$/, "");
  if (!clean) {
    return `/twitter${search}`;
  }
  const segments = clean.slice(1).split("/").filter(Boolean);
  if (segments.length === 0) {
    return `/twitter${search}`;
  }
  const [first, second, third] = segments;
  if (TWITTER_RESERVED_ROOTS.has(first)) {
    return `/twitter/${segments.join("/")}${search}`;
  }
  if (second === "status" && third) {
    return `/twitter/post/${third}${search}`;
  }
  const handle = first.replace(/^@/, "");
  const tail = segments.slice(1);
  return `/twitter/profile/${[handle, ...tail].join("/")}${search}`;
}

/**
 * オムニボックス入力をアプリ内部パスへ解決する。
 * - 先頭 `/`（`//` を除く）は内部パスとしてそのまま返す
 * - 作中ドメイン（http(s):// あり／なし）は対応する内部ルートに変換する
 * - それ以外は Seek 検索クエリ `/search?q=...` として返す
 */
export function resolveOmniboxInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "/search";
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  const withoutScheme = trimmed.replace(/^https?:\/\//i, "");
  const hostMatch = /^([a-z0-9.-]+)(.*)$/i.exec(withoutScheme);
  if (hostMatch) {
    const [, rawHost, rawRest] = hostMatch;
    const hostBoundaryOk =
      rawRest === "" ||
      rawRest.startsWith("/") ||
      rawRest.startsWith("?") ||
      rawRest.startsWith("#");

    if (hostBoundaryOk) {
      const host = rawHost.toLowerCase().replace(/^www\./, "");
      let parsed: URL | undefined;
      try {
        parsed = new URL(`https://${host}${rawRest}`);
      } catch {
        parsed = undefined;
      }

      if (parsed) {
        const subPath = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
        const search = parsed.search;

        switch (host) {
          case DISCORD_HOST:
            return subPath ? `/${APP_PREFIX}${subPath}${search}` : `${dmListPath()}${search}`;
          case TWIXER_HOST:
            return resolveTwixerPath(subPath, search);
          case POCHIBLO_HOST:
            return `/pochiblo${subPath}${search}`;
          case LEAF_HOST:
            return `/note${subPath}${search}`;
          case TALKUP_HOST:
            return `/talkup${subPath}${search}`;
          case SEEK_HOST:
            return subPath === "" || subPath === "/search"
              ? `/search${search}`
              : `/search${subPath}${search}`;
          default:
            break;
        }
      }
    }
  }

  return `/search?q=${encodeURIComponent(trimmed)}`;
}

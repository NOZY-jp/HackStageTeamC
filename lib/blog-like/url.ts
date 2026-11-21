import { APP_PREFIX } from "@/lib/platform/app-prefix";
import { LEAF_HOST, TWIXER_HOST } from "./data/names";

/**
 * URLの「受理する形」の定義をこのファイルに集約する。
 * 埋め込みカード（lib/link-embed）と記事内リンク（entry-body）の両方がこの定義を使う。
 * - スキーム: http/https だけ。スキーム省略は作中ドメインの直書きのみ認める
 *   （ftp: など別スキームのURLは、ホストが作中ドメインでも受理しない）
 * - オリジン: FICTION_ORIGINS の作中ドメイン、またはこのアプリ自身（selfOrigin）
 * - パス形状: 各ドメインの対応関数が返す形だけ。それ以外は undefined
 */

/** 受理するスキームは http/https のみ（大文字表記も同じURLとして受ける） */
const ACCEPTED_SCHEME_RE = /^https?:\/\//i;
/** scheme:// が書かれているかの判定。書かれていて http(s) でないURLは受理しない */
const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;

const stripTrailingSlash = (path: string) => path.replace(/\/+$/, "") || "/";

// twixer.com/<handle>/status/<id> → /twitter/post/<id>、twixer.com/<handle> → /twitter/profile/<handle>
// <handle>/status/<id> の形を壊したものや余分なセグメントのあるURLは存在しないページなので受理しない
function twixerPath([handle, section, statusId, ...rest]: string[]): string | undefined {
  if (handle === undefined) return "/twitter";
  if (!handle) return undefined;
  if (section === undefined) return `/twitter/profile/${handle}`;
  if (section === "status" && statusId && rest.length === 0) {
    return `/twitter/post/${statusId}`;
  }
  return undefined;
}

// pochiblo.jp/<...> → /pochiblo/<...>、<APP_PREFIX>/<...> → /<APP_PREFIX>/<...> のようにパスをそのまま写す
const prefixed = (base: string) => (segments: string[]) =>
  segments.length > 0 ? `${base}/${segments.join("/")}` : base;

/**
 * 作中ドメイン → アプリ内パスの対応表。キーが受理するオリジン（ホスト名）、
 * 値が許すパス形状（パスセグメント → アプリ内パス。許さない形は undefined）。
 */
const FICTION_ORIGINS: Record<string, (segments: string[]) => string | undefined> = {
  [TWIXER_HOST]: twixerPath,
  // leaf.jp/<creator>[/n/<id>] → /note/<creator>[/n/<id>]
  [LEAF_HOST]: (path) => (path.length > 0 ? `/note/${path.join("/")}` : "/note"),
  "pochiblo.jp": prefixed("/pochiblo"),
  [APP_PREFIX]: prefixed(`/${APP_PREFIX}`),
};

/**
 * URL文字列をホストとパスセグメントに分ける。クエリ・フラグメントは捨てる。
 * scheme:// が書かれているのに http(s) でないURLは undefined（受理しない）。
 */
function splitUrl(url: string): { host: string; segments: string[] } | undefined {
  const body = url.split(/[?#]/)[0].replace(/\/+$/, "");
  if (SCHEME_RE.test(body) && !ACCEPTED_SCHEME_RE.test(body)) return undefined;
  const [host = "", ...segments] = body.replace(ACCEPTED_SCHEME_RE, "").split("/");
  return { host: host.toLowerCase(), segments };
}

/**
 * 同一オリジン判定。selfOrigin はクライアントの location.origin（スキーム込み）。
 * スキームを含めて比べるので、ホストとポートが同じでも http と https は別オリジン。
 * スキームなしの値が来た場合はホスト名:ポートだけで比べる（後方互換）。
 */
function isSameOrigin(url: URL, selfOrigin?: string): boolean {
  if (!selfOrigin) return false;
  if (!selfOrigin.includes("://")) {
    return url.host.toLowerCase() === selfOrigin.toLowerCase();
  }
  try {
    return url.origin === new URL(selfOrigin).origin;
  } catch {
    return false;
  }
}

/**
 * URL文字列をアプリ内パスに正規化する。受理する形はファイル冒頭の定義どおり。
 * - "/..." のアプリ内パス → そのまま
 * - 作中ドメイン（スキーム省略可）→ FICTION_ORIGINS の対応パス
 * - それ以外 → このアプリ自身の http(s) URL（selfOrigin と同一オリジン）だけパスを見る。
 *   外部サイトがたまたまアプリ内ルートと同じパスを持っていてもカード・リンクにしない
 */
export function toAppPath(url: string, selfOrigin?: string): string | undefined {
  if (url.startsWith("/")) return stripTrailingSlash(url);
  const parsed = splitUrl(url);
  if (!parsed) return undefined;
  const fiction = FICTION_ORIGINS[parsed.host]?.(parsed.segments);
  if (fiction) return fiction;
  if (!ACCEPTED_SCHEME_RE.test(url)) return undefined;
  try {
    const self = new URL(url);
    return isSameOrigin(self, selfOrigin) ? stripTrailingSlash(self.pathname) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 作中の URL（スキーム省略可）を、このアプリ内のパスに変換する。
 * 受理する形の定義は toAppPath と同じ（このアプリ自身のURLと絶対パスは対象外）。
 */
export function externalHref(url: string): string | undefined {
  if (url.startsWith("/")) return undefined;
  return toAppPath(url);
}

/**
 * `twixer.com/<handle>/status/<id>` 形式のURLを、ハンドルと投稿IDに分解する。
 * 埋め込みカードで「URLのハンドルが投稿の作者と一致するか」を確かめるために使う
 * （`toAppPath` はハンドルを捨てて `/twitter/post/<id>` に寄せるため）。
 */
export function parseTwixerStatusUrl(
  url: string,
): { handle: string; statusId: string } | undefined {
  const parsed = splitUrl(url);
  const [handle, section, statusId, ...rest] = parsed?.segments ?? [];
  // status/<id> の後ろにさらにセグメントがあるURLは別ページなので投稿URLとして扱わない
  if (
    parsed?.host !== TWIXER_HOST ||
    !handle ||
    section !== "status" ||
    !statusId ||
    rest.length > 0
  ) {
    return undefined;
  }
  return { handle, statusId };
}

/** ブログのトップ: /pochiblo/<blogId> */
export function blogPath(blogId: string): string {
  return `/pochiblo/${blogId}`;
}

/** 記事: /pochiblo/<blogId>/entry/<entryId> */
export function entryPath(blogId: string, entryId: string): string {
  return `${blogPath(blogId)}/entry/${entryId}`;
}

/** マイリスト: /pochiblo/mylist/<mylistId> */
export function mylistPath(mylistId: string): string {
  return `/pochiblo/mylist/${mylistId}`;
}

/**
 * "2018-01-27T21:30:00+09:00" → "2018年1月27日 21:30"（style="date" なら日付まで）。
 * 日本時間の固定文字列なので、実行環境のタイムゾーンに左右されないよう文字列から組み立てる。
 */
export function formatDate(iso: string, style: "datetime" | "date" = "datetime"): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match) {
    return iso;
  }
  const [, year, month, day, hour, minute] = match;
  const date = `${year}年${Number(month)}月${Number(day)}日`;
  return style === "date" ? date : `${date} ${hour}:${minute}`;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "2018-01-27T21:30:00+09:00" → "2018年01月27日（土）"（当時のブログの日付の帯の書き方） */
export function formatDateBand(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    return iso;
  }
  const [, year, month, day] = match;
  // 日付だけで曜日を出す（時刻とタイムゾーンを使わない）
  const weekday =
    WEEKDAYS[new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

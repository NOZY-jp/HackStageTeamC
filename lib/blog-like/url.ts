import { LEAF_HOST, TWIXER_HOST } from "./data/names";

/**
 * 作中の URL（スキームなしの文字列）を、このアプリ内のパスに変換する。
 * 他プラットフォームのコードは import せず、パスの文字列だけを組み立てる。
 * - leaf.jp/<creator>[/n/<id>] → /note/<creator>[/n/<id>]
 * - twixer.com/<handle>/status/<id> → /twitter/post/<id>
 * - twixer.com/<handle> → /twitter/profile/<handle>
 * 知らないサイトなら undefined（リンクにしない）。
 */
export function externalHref(url: string): string | undefined {
  const [host, ...path] = url
    .replace(/^[a-z]+:\/\//i, "")
    .replace(/\/+$/, "")
    .split("/");
  switch (host.toLowerCase()) {
    case LEAF_HOST:
      return path.length > 0 ? `/note/${path.join("/")}` : "/note";
    case TWIXER_HOST: {
      const status = parseTwixerStatusUrl(url);
      if (status) {
        return `/twitter/post/${status.statusId}`;
      }
      // プロフィールに解決するのは <handle> だけのURL。<handle>/status/<id> の形を
      // 壊したものや余分なセグメントのあるURLは存在しないページなのでリンクにしない
      const [handle] = path;
      if (handle === undefined) {
        return "/twitter";
      }
      return path.length === 1 ? `/twitter/profile/${handle}` : undefined;
    }
    default:
      return undefined;
  }
}

/**
 * `twixer.com/<handle>/status/<id>` 形式のURLを、ハンドルと投稿IDに分解する。
 * 埋め込みカードで「URLのハンドルが投稿の作者と一致するか」を確かめるために使う
 * （`externalHref` はハンドルを捨てて `/twitter/post/<id>` に寄せるため）。
 */
export function parseTwixerStatusUrl(
  url: string,
): { handle: string; statusId: string } | undefined {
  const [host, handle, section, statusId, ...rest] = url
    .replace(/^[a-z]+:\/\//i, "")
    .replace(/\/+$/, "")
    .split("/");
  // status/<id> の後ろにさらにセグメントがあるURLは別ページなので投稿URLとして扱わない
  if (
    host.toLowerCase() !== TWIXER_HOST ||
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

/**
 * メッセージ検索のクエリ解析（純関数）。
 * データ層に依存しないので、クライアント（入力中の不正チェック）からも使える。
 *
 * 記法は Discord 準拠: `from:` / `in:` / `before:` / `after:` / `during:` /
 * `has:` / `mentions:` / `pinned:`。それ以外の語はフリーワード（複数は AND）。
 */

export type SearchOrder = "new" | "old";

export const HAS_KINDS = ["link", "embed", "file", "image", "video"] as const;
export type HasKind = (typeof HAS_KINDS)[number];

export type SearchFilters = {
  from: string[];
  in: string[];
  /** この日より前（YYYY-MM-DD） */
  before?: string;
  /** この日より後（YYYY-MM-DD） */
  after?: string;
  /** 期間（両端を含む） */
  during?: { start: string; end: string };
  has: HasKind[];
  mentions: string[];
  pinned?: boolean;
};

export type SearchParseError = {
  /** 問題になったトークン（そのまま表示する） */
  token: string;
  message: string;
};

export type ParsedSearch = {
  terms: string[];
  filters: SearchFilters;
  error?: SearchParseError;
};

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;
const YEAR = /^(\d{4})$/;

const emptyFilters = (): SearchFilters => ({
  from: [],
  in: [],
  has: [],
  mentions: [],
});

const isValidDate = (year: number, month: number, day: number): boolean => {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
};

/** `during:` の値を [start, end]（両端を含む YYYY-MM-DD）に開く。不正なら null。 */
export function parseDuring(value: string): { start: string; end: string } | null {
  const date = DATE.exec(value);
  if (date) {
    const [, y, m, d] = date;
    if (!isValidDate(Number(y), Number(m), Number(d))) {
      return null;
    }
    return { start: value, end: value };
  }

  const month = MONTH.exec(value);
  if (month) {
    const [, y, m] = month;
    const year = Number(y);
    const monthNumber = Number(m);
    if (monthNumber < 1 || monthNumber > 12) {
      return null;
    }
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return {
      start: `${y}-${m}-01`,
      end: `${y}-${m}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  const year = YEAR.exec(value);
  if (year) {
    return { start: `${value}-01-01`, end: `${value}-12-31` };
  }

  return null;
}

/** `before:` / `after:` の値を YYYY-MM-DD に正規化する。不正なら null。 */
function parseDate(value: string): string | null {
  const match = DATE.exec(value);
  if (!match) {
    return null;
  }
  const [, y, m, d] = match;
  return isValidDate(Number(y), Number(m), Number(d)) ? value : null;
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.toLowerCase();
  if (["true", "1", "yes", "はい"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "いいえ"].includes(normalized)) {
    return false;
  }
  return null;
}

type KnownKey = "from" | "in" | "before" | "after" | "during" | "has" | "mentions" | "pinned";

const KNOWN_KEYS: ReadonlySet<string> = new Set<KnownKey>([
  "from",
  "in",
  "before",
  "after",
  "during",
  "has",
  "mentions",
  "pinned",
]);

/**
 * 入力文字列を解析する。不正なフィルタは `error` に入れ、フリーワードは小文字化して返す。
 * 知らない `key:value`（例 `http://...` 以外の未知キー）はフリーワード扱い（Discord と同じ）。
 */
export function parseQuery(input: string): ParsedSearch {
  const filters = emptyFilters();
  const terms: string[] = [];
  let error: SearchParseError | undefined;

  for (const raw of input.split(/[\s\u3000]+/)) {
    if (!raw) {
      continue;
    }
    const index = raw.indexOf(":");
    const key = index > 0 ? raw.slice(0, index).toLowerCase() : "";
    if (!KNOWN_KEYS.has(key)) {
      terms.push(raw.toLowerCase());
      continue;
    }

    const value = raw.slice(index + 1).trim();
    if (!value) {
      error ??= { token: raw, message: `${key}: の値がありません` };
      continue;
    }

    switch (key as KnownKey) {
      case "from":
        filters.from.push(value);
        break;
      case "in":
        filters.in.push(value);
        break;
      case "mentions":
        filters.mentions.push(value);
        break;
      case "has": {
        const kind = value.toLowerCase() as HasKind;
        if (!HAS_KINDS.includes(kind)) {
          error ??= {
            token: raw,
            message: `has: は ${HAS_KINDS.join(" / ")} のいずれかです`,
          };
          break;
        }
        filters.has.push(kind);
        break;
      }
      case "before": {
        const date = parseDate(value);
        if (!date) {
          error ??= { token: raw, message: "before: の日付は YYYY-MM-DD で指定してください" };
          break;
        }
        filters.before = date;
        break;
      }
      case "after": {
        const date = parseDate(value);
        if (!date) {
          error ??= { token: raw, message: "after: の日付は YYYY-MM-DD で指定してください" };
          break;
        }
        filters.after = date;
        break;
      }
      case "during": {
        const during = parseDuring(value);
        if (!during) {
          error ??= {
            token: raw,
            message: "during: は YYYY / YYYY-MM / YYYY-MM-DD で指定してください",
          };
          break;
        }
        filters.during = during;
        break;
      }
      case "pinned": {
        const pinned = parseBoolean(value);
        if (pinned === null) {
          error ??= { token: raw, message: "pinned: は true / false で指定してください" };
          break;
        }
        filters.pinned = pinned;
        break;
      }
    }
  }

  return error ? { terms, filters, error } : { terms, filters };
}

import { dmThreads } from "./data/dm-threads";
import { guilds } from "./data/guilds";
import { channelMessages, dmMessages } from "./data/messages";
import { users } from "./data/users";
import {
  type HasKind,
  type ParsedSearch,
  parseQuery,
  type SearchOrder,
  type SearchParseError,
} from "./search-query";

/**
 * モックデータ上の全文検索。インデックスはプロセス内で1回だけ作る。
 * 本文はここ（サーバー側）で完結し、クライアントへはヒットした行だけを返す。
 */

/** 検索でヒットした1件。ジャンプに必要な URL 断片も持つ。 */
export type SearchHit = {
  id: string;
  mode: "channel" | "dm";
  guildUrlId?: string;
  channelUrlId?: string;
  threadUrlId?: string;
  /** チャンネル名（DM は相手の表示名） */
  channelLabel: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  sentAt: string;
  body: string;
  pinned: boolean;
};

export type MatchedUser = {
  id: string;
  displayName: string;
  handle: string;
  status?: "online" | "idle" | "dnd" | "offline";
  profileUrl?: string;
};

export type SearchResponse =
  | {
      ok: true;
      hits: SearchHit[];
      /** 上限で切る前の総件数 */
      total: number;
      /** `from:` に一致したユーザー（本文が無い旧垢でも「存在」に辿り着けるように） */
      matchedUsers: MatchedUser[];
    }
  | { ok: false; error: SearchParseError };

type SearchDocument = SearchHit & {
  lowerBody: string;
  /** `in:` で引くための表記（チャンネル名・DM の相手名など） */
  inLabels: string[];
  has: Record<HasKind, boolean>;
};

export type SearchIndex = {
  documents: SearchDocument[];
  users: MatchedUser[];
};

const LINK = /https?:\/\/\S+/;

const flagsOf = (
  body: string,
  attachments: { kind: string }[] | undefined,
): Record<HasKind, boolean> => {
  const kinds = new Set((attachments ?? []).map((attachment) => attachment.kind));
  const link = LINK.test(body);
  return {
    link,
    // 埋め込み（リンクプレビュー）は本文の URL から作られる想定
    embed: link,
    file: kinds.has("file"),
    image: kinds.has("image"),
    video: kinds.has("video"),
  };
};

/** インデックスを組み立てる（純関数・データは読むだけ）。 */
export function buildSearchIndex(): SearchIndex {
  const userById = new Map(users.map((user) => [user.id, user]));
  const documents: SearchDocument[] = [];

  for (const guild of guilds) {
    for (const channel of guild.channels) {
      if (channel.kind !== "text") {
        continue;
      }
      for (const message of channelMessages[channel.id] ?? []) {
        const author = userById.get(message.authorId);
        const authorName = author?.displayName ?? message.authorId;
        const authorHandle = author?.handle ?? message.authorId;
        documents.push({
          id: message.id,
          mode: "channel",
          guildUrlId: guild.urlId,
          channelUrlId: channel.urlId,
          channelLabel: channel.name,
          authorId: message.authorId,
          authorName,
          authorHandle,
          sentAt: message.sentAt,
          body: message.body,
          lowerBody: message.body.toLowerCase(),
          pinned: message.pinned === true,
          has: flagsOf(message.body, message.attachments),
          inLabels: [channel.name, `#${channel.name}`, guild.name].map((label) =>
            label.toLowerCase(),
          ),
        });
      }
    }
  }

  const threadById = new Map(dmThreads.map((thread) => [thread.id, thread]));
  for (const [threadId, messages] of Object.entries(dmMessages)) {
    const thread = threadById.get(threadId);
    if (!thread) {
      continue;
    }
    for (const message of messages) {
      const author = userById.get(message.authorId);
      const authorName = author?.displayName ?? message.authorId;
      const authorHandle = author?.handle ?? message.authorId;
      const partnerId =
        thread.participantIds.find((id) => id !== "hal") ?? thread.participantIds[0];
      const partner = userById.get(partnerId);
      const partnerName = partner?.displayName ?? partnerId;
      documents.push({
        id: message.id,
        mode: "dm",
        threadUrlId: thread.urlId,
        channelLabel: partnerName,
        authorId: message.authorId,
        authorName,
        authorHandle,
        sentAt: message.sentAt,
        body: message.body,
        lowerBody: message.body.toLowerCase(),
        pinned: message.pinned === true,
        has: flagsOf(message.body, message.attachments),
        inLabels: [partnerName, partner?.handle ?? partnerId, "dm", "ダイレクトメッセージ"].map(
          (label) => label.toLowerCase(),
        ),
      });
    }
  }

  return {
    documents,
    users: users.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      handle: user.handle,
      status: user.status,
      ...(user.profileUrl ? { profileUrl: user.profileUrl } : {}),
    })),
  };
}

const normalizeName = (value: string): string => value.toLowerCase().replace(/^@/, "");

const matchesName = (name: string, handle: string, value: string): boolean => {
  const needle = normalizeName(value);
  return normalizeName(name) === needle || normalizeName(handle) === needle;
};

const dateOf = (sentAt: string): string => sentAt.slice(0, 10);

/** 解析済みクエリを1件の文書に当てる。 */
function matchesDocument(document: SearchDocument, parsed: ParsedSearch): boolean {
  const { filters, terms } = parsed;

  if (filters.from.length > 0) {
    const matched = filters.from.some((value) =>
      matchesName(document.authorName, document.authorHandle, value),
    );
    if (!matched) {
      return false;
    }
  }

  if (filters.in.length > 0) {
    const matched = filters.in.some((value) => {
      const needle = value.toLowerCase().replace(/^#/, "");
      return document.inLabels.some((label) => label.replace(/^#/, "") === needle);
    });
    if (!matched) {
      return false;
    }
  }

  if (filters.mentions.length > 0) {
    const matched = filters.mentions.some((value) => {
      const needle = normalizeName(value);
      return document.lowerBody.includes(`@${needle}`);
    });
    if (!matched) {
      return false;
    }
  }

  if (filters.has.length > 0 && !filters.has.every((kind) => document.has[kind])) {
    return false;
  }

  if (filters.pinned !== undefined && document.pinned !== filters.pinned) {
    return false;
  }

  const date = dateOf(document.sentAt);
  if (filters.before !== undefined && !(date < filters.before)) {
    return false;
  }
  if (filters.after !== undefined && !(date > filters.after)) {
    return false;
  }
  if (filters.during !== undefined && (date < filters.during.start || date > filters.during.end)) {
    return false;
  }

  // フリーワードはすべて含む（AND）
  return terms.every((term) => document.lowerBody.includes(term));
}

const HIT_KEYS = [
  "id",
  "mode",
  "guildUrlId",
  "channelUrlId",
  "threadUrlId",
  "channelLabel",
  "authorId",
  "authorName",
  "authorHandle",
  "sentAt",
  "body",
  "pinned",
] as const;

const toHit = (document: SearchDocument): SearchHit => {
  const hit = {} as SearchHit;
  for (const key of HIT_KEYS) {
    // すべて省略可能なキーなので、値があるものだけ写す
    const value = document[key];
    if (value !== undefined) {
      (hit as Record<string, unknown>)[key] = value;
    }
  }
  return hit;
};

/** 解析済みクエリで検索する（並び順と件数上限を適用）。 */
export function searchIndex(
  index: SearchIndex,
  parsed: ParsedSearch,
  options: { order?: SearchOrder; limit?: number } = {},
): SearchResponse {
  if (parsed.error) {
    return { ok: false, error: parsed.error };
  }

  const limit = Math.max(1, options.limit ?? 50);
  const matched = index.documents.filter((document) => matchesDocument(document, parsed));
  const order = options.order ?? "new";
  matched.sort((a, b) =>
    order === "new" ? b.sentAt.localeCompare(a.sentAt) : a.sentAt.localeCompare(b.sentAt),
  );

  const matchedUsers =
    parsed.filters.from.length > 0
      ? index.users.filter((user) =>
          parsed.filters.from.some((value) => matchesName(user.displayName, user.handle, value)),
        )
      : parsed.terms.length > 0
        ? (() => {
            const needles = parsed.terms.map(normalizeName);
            if (needles.some((needle) => needle.length === 0)) {
              return [];
            }
            return index.users.filter((user) => {
              // 旧アカウントは画像に写るハンドルを照合して見つける。
              if (user.id === "denden") {
                return needles.length === 1 && needles[0] === normalizeName(user.handle);
              }
              const display = user.displayName.toLowerCase();
              const handle = user.handle.toLowerCase();
              return needles.every((needle) => display.includes(needle) || handle.includes(needle));
            });
          })()
        : [];

  return {
    ok: true,
    hits: matched.slice(0, limit).map(toHit),
    total: matched.length,
    matchedUsers,
  };
}

let cachedIndex: SearchIndex | null = null;

/** インデックスは1回だけ作る（ビルド後の初回検索時に生成）。 */
export function getSearchIndex(): SearchIndex {
  cachedIndex ??= buildSearchIndex();
  return cachedIndex;
}

/** 入力文字列から検索する。 */
export function runSearch(input: {
  query: string;
  order?: SearchOrder;
  limit?: number;
}): SearchResponse {
  return searchIndex(getSearchIndex(), parseQuery(input.query), {
    order: input.order,
    limit: input.limit,
  });
}

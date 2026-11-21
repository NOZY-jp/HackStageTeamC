import { blogs, entries, mylists } from "@/lib/blog-like/data/blog";
import { photoContestResult } from "@/lib/blog-like/data/contest";
import { dmThreads } from "@/lib/discord-like/data/dm-threads";
import { guilds } from "@/lib/discord-like/data/guilds";
import { MESSAGE_IMAGES } from "@/lib/discord-like/data/message-images";
import { channelMessages, dmMessages } from "@/lib/discord-like/data/messages";
import { users as discordUsers } from "@/lib/discord-like/data/users";
import { voiceSessions } from "@/lib/discord-like/data/voice-sessions";
import { voiceStates } from "@/lib/discord-like/data/voice-states";
import { fbPosts } from "@/lib/facebook-like/data/posts";
import { fbUsers } from "@/lib/facebook-like/data/users";
import { articles } from "@/lib/note-like/data/articles";
import { creators } from "@/lib/note-like/data/creators";
import {
  twitterPosts,
  twitterProfiles,
  twitterTrends,
  twitterUsers,
} from "@/lib/twitter-like/data/twitter";
import { twitterConversations } from "@/lib/twitter-like/data/twitter-messages";

/**
 * 各プラットフォームの仮データを、検査しやすい1つの形（DataItem）に並べ直す。
 * データの型が変わっても検査が壊れないよう、レコードの中の文字列はすべて機械的に集める。
 *
 * ここだけは、すべてのプラットフォームの lib を読む（検査のための例外。画面のコードからは import しない）。
 */

export type Platform = "discord" | "twixer" | "leaf" | "talkup" | "pochiblo";

export type DataItem = {
  platform: Platform;
  /** どのデータか（"messages" "posts" など。検査の結果に出す） */
  dataset: string;
  id: string;
  /** レコードに含まれる文字列（入れ子も含めて全部。URL や色は除く） */
  texts: string[];
  /** 日時フィールドの値。形式が不正でも検査対象に含める */
  times: { key: string; value: string }[];
  /** 同じ入れ子の配列に複数回現れた ID と、その配列の場所 */
  duplicateNestedIds: { path: string; id: string }[];
};

const isTimeKey = (key: string) => key === "date" || /(?:At|Date)$/.test(key);
const looksLikeNoise = (value: string) =>
  /^(?:https?:|\/)\S+$/.test(value) ||
  /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|[0-9a-f]{6})$/i.test(value);

function walk(value: unknown, key: string, path: string, item: DataItem) {
  if (typeof value === "string") {
    if (isTimeKey(key)) item.times.push({ key, value });
    else if (!looksLikeNoise(value)) item.texts.push(value);
    return;
  }
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    for (const [index, child] of value.entries()) {
      if (child && typeof child === "object" && "id" in child) {
        const { id } = child;
        if (typeof id === "string" || typeof id === "number") {
          const idString = String(id);
          if (seen.has(idString)) item.duplicateNestedIds.push({ path, id: idString });
          seen.add(idString);
        }
      }
      walk(child, key, `${path}[${index}]`, item);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) {
      walk(child, childKey, path ? `${path}.${childKey}` : childKey, item);
    }
  }
}

export function itemsOf<RecordType extends object>(
  platform: Platform,
  dataset: string,
  records: readonly RecordType[],
  idOf: (record: RecordType, index: number) => string = (record, index) =>
    String(
      ("id" in record ? record.id : undefined) ??
        ("userId" in record ? record.userId : index) ??
        index,
    ),
): DataItem[] {
  return records.map((record, index) => {
    const item: DataItem = {
      platform,
      dataset,
      id: idOf(record, index),
      texts: [],
      times: [],
      duplicateNestedIds: [],
    };
    walk(record, "", "", item);
    return item;
  });
}

/** 検査するすべての仮データ */
export function collectCorpus(): DataItem[] {
  return [
    ...itemsOf("discord", "users", discordUsers),
    ...itemsOf("discord", "guilds", guilds),
    ...itemsOf("discord", "dmThreads", dmThreads),
    ...itemsOf("discord", "channelMessages", Object.values(channelMessages).flat()),
    ...itemsOf("discord", "dmMessages", Object.values(dmMessages).flat()),
    ...itemsOf("discord", "voiceStates", voiceStates),
    ...itemsOf("discord", "voiceSessions", voiceSessions),
    ...itemsOf("discord", "messageImages", Object.values(MESSAGE_IMAGES), (image) => image.name),
    ...itemsOf("twixer", "users", twitterUsers),
    ...itemsOf("twixer", "profiles", twitterProfiles),
    ...itemsOf("twixer", "posts", twitterPosts),
    ...itemsOf("twixer", "trends", twitterTrends),
    ...itemsOf("twixer", "conversations", twitterConversations),
    ...itemsOf("leaf", "creators", creators),
    ...itemsOf("leaf", "articles", articles),
    ...itemsOf("talkup", "users", fbUsers),
    ...itemsOf("talkup", "posts", fbPosts),
    ...itemsOf("pochiblo", "blogs", blogs),
    ...itemsOf("pochiblo", "entries", entries),
    ...itemsOf("pochiblo", "mylists", mylists),
    ...itemsOf("pochiblo", "contestResults", [photoContestResult]),
  ];
}

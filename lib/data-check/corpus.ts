import { blogs, entries, mylists } from "@/lib/blog-like/data/blog";
import { channelMessages, dmMessages } from "@/lib/discord-like/data/messages";
import { users as discordUsers } from "@/lib/discord-like/data/users";
import { fbPosts } from "@/lib/facebook-like/data/posts";
import { fbUsers } from "@/lib/facebook-like/data/users";
import { articles } from "@/lib/note-like/data/articles";
import { creators } from "@/lib/note-like/data/creators";
import { twitterPosts, twitterProfiles, twitterUsers } from "@/lib/twitter-like/data/twitter";
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
  /** レコードに含まれる日時（キーが At / Date で終わる ISO 8601 の値） */
  times: { key: string; value: string }[];
};

const isTimeKey = (key: string) => /(At|Date|date)$/.test(key);
const looksLikeNoise = (value: string) =>
  /^(#|https?:|\/)/.test(value) || /^[0-9a-f]{6}$/i.test(value);

function walk(
  value: unknown,
  key: string,
  texts: string[],
  times: { key: string; value: string }[],
) {
  if (typeof value === "string") {
    if (isTimeKey(key)) times.push({ key, value });
    else if (!looksLikeNoise(value)) texts.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walk(item, key, texts, times);
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) walk(child, childKey, texts, times);
  }
}

function itemsOf(
  platform: Platform,
  dataset: string,
  records: readonly unknown[],
  idOf: (record: Record<string, unknown>, index: number) => string = (record, index) =>
    String(record.id ?? record.userId ?? index),
): DataItem[] {
  return records.map((record, index) => {
    const texts: string[] = [];
    const times: { key: string; value: string }[] = [];
    walk(record, "", texts, times);
    return {
      platform,
      dataset,
      id: idOf(record as Record<string, unknown>, index),
      texts,
      times,
    };
  });
}

/** 検査するすべての仮データ */
export function collectCorpus(): DataItem[] {
  return [
    ...itemsOf("discord", "users", discordUsers),
    ...itemsOf("discord", "channelMessages", Object.values(channelMessages).flat()),
    ...itemsOf("discord", "dmMessages", Object.values(dmMessages).flat()),
    ...itemsOf("twixer", "users", twitterUsers),
    ...itemsOf("twixer", "profiles", twitterProfiles),
    ...itemsOf("twixer", "posts", twitterPosts),
    ...itemsOf("twixer", "conversations", twitterConversations),
    ...itemsOf("leaf", "creators", creators),
    ...itemsOf("leaf", "articles", articles),
    ...itemsOf("talkup", "users", fbUsers),
    ...itemsOf("talkup", "posts", fbPosts),
    ...itemsOf("pochiblo", "blogs", blogs),
    ...itemsOf("pochiblo", "entries", entries),
    ...itemsOf("pochiblo", "mylists", mylists),
  ];
}

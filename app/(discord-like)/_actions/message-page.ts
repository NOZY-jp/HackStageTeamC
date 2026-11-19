"use server";

import { listDMMessages, listMessages } from "@/lib/discord-like";
import type { MessageView } from "@/lib/discord-like/types";
import { toMessageView } from "@/lib/discord-like/view";

/**
 * 古いメッセージのページをサーバーで切り出して返す。
 * クライアントはデータ層を import しないので、全チャンネルの本文がバンドルに入らない。
 * Route Handler ではなく Server Action を採用（同一オリジン・型付きで呼べ、URL を増やさないため）。
 */
export async function fetchMessagePage(input: {
  mode: "channel" | "dm";
  key: string;
  before?: string;
  limit?: number;
}): Promise<MessageView> {
  const page =
    input.mode === "dm"
      ? listDMMessages({ threadId: input.key, before: input.before, limit: input.limit })
      : listMessages({ channelId: input.key, before: input.before, limit: input.limit });
  return toMessageView(page);
}

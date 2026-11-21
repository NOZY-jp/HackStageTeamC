import type { Message } from "@/lib/discord-like/types";

/** 通話の開始・終了など、会話のプレビューに出さないシステム行 */
const SYSTEM_CALL = /通話を(開始|終了)しました|応答がありませんでした/;

/**
 * DM一覧のプレビューに使う「最後の会話」。システム行は無視し、
 * 実際の発言だけを時刻で選ぶ（#217）。固定値は持たず、メッセージから導出する。
 */
export function latestConversation(messages: readonly Message[]): Message | undefined {
  let latest: Message | undefined;
  for (const message of messages) {
    if (message.system === true || SYSTEM_CALL.test(message.body)) continue;
    if (!latest || message.sentAt.localeCompare(latest.sentAt) >= 0) latest = message;
  }
  return latest;
}

/** 一覧の1行ぶんの表示（プレビューと時刻） */
export function threadPreview(
  base: { sentAt?: string; preview: string; time: string },
  live: readonly Message[],
): { preview: string; time: string } {
  const latest = latestConversation(live);
  if (latest && (!base.sentAt || latest.sentAt.localeCompare(base.sentAt) > 0)) {
    return {
      preview: latest.body.replace(/\s+/g, " ").slice(0, 80),
      time: latest.sentAt.slice(11, 16),
    };
  }
  return { preview: base.preview, time: base.time };
}

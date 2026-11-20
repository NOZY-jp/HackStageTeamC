import { getChannelByUrlId, getDMThreadByUrlId, getGuildByUrlId } from "./index";

/** DM のホームセグメント（Discord と同じ `@me`）。 */
export const DM_HOME = "@me";

/** DM の通話画面かどうか（`/<app>/channels/@me/<dm>/call`）。 */
export function resolveDmCallRoute(
  guildSegment: string,
  channelSegment: string,
): { kind: "dm-call"; threadId: string } | { kind: "missing" } {
  const guildId = decodeURIComponent(guildSegment);
  if (guildId !== DM_HOME) {
    return { kind: "missing" };
  }
  const thread = getDMThreadByUrlId(decodeURIComponent(channelSegment));
  return thread ? { kind: "dm-call", threadId: thread.id } : { kind: "missing" };
}

export type ChannelRoute =
  | { kind: "dm"; threadId: string }
  | { kind: "dm-missing" }
  | { kind: "channel"; guildId: string; channelId: string }
  | { kind: "channel-missing" };

/**
 * `/<app>/channels/<guildId>/<channelId>` の2セグメントを解決する。
 * `@me` なら DM スレッド、それ以外はサーバーのチャンネル。
 * 見つからない場合はどちらの未検出UIを出すかを kind で返す（DMは専用表示）。
 */
export function resolveChannelRoute(guildSegment: string, channelSegment: string): ChannelRoute {
  // 動的セグメントは URL エンコードされたまま渡ることがある（"@me" → "%40me"）
  const guildId = decodeURIComponent(guildSegment);

  if (guildId === DM_HOME) {
    const thread = getDMThreadByUrlId(channelSegment);
    return thread ? { kind: "dm", threadId: thread.id } : { kind: "dm-missing" };
  }

  const guild = getGuildByUrlId(guildId);
  const channel = getChannelByUrlId(channelSegment);
  if (!guild || !channel || channel.guildId !== guild.id) {
    return { kind: "channel-missing" };
  }
  return { kind: "channel", guildId: guild.id, channelId: channel.id };
}

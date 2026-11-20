import { getGuildByUrlId, listChannels } from "@/lib/discord-like";
import { dmListPath, guildChannelPath } from "@/lib/platform/app-prefix";

/**
 * チャンネル未検出のときの戻り先（#70）。
 * ボタンの文言とリンク先を必ず一致させるための唯一の判定場所。
 * - guild がある: 「サーバーへ戻る」→ そのサーバーの最初のテキストチャンネル
 * - guild が無い: 「DMへ戻る」→ DM一覧（サーバーの一覧は出さない）
 */
export type ChannelFallback = {
  href: string;
  label: "サーバーへ戻る" | "DMへ戻る";
  /** サーバーの一覧（サイドバー）を出せるか */
  hasServer: boolean;
};

export function channelFallback(guildSegment: string): ChannelFallback {
  const guild = getGuildByUrlId(decodeURIComponent(guildSegment));
  if (!guild) {
    return { href: dmListPath(), label: "DMへ戻る", hasServer: false };
  }

  const channels = listChannels(guild.id);
  const first = channels.find((channel) => channel.kind === "text") ?? channels[0];
  if (!first) {
    return { href: dmListPath(), label: "DMへ戻る", hasServer: true };
  }
  return {
    href: guildChannelPath(guild.urlId, first.urlId),
    label: "サーバーへ戻る",
    hasServer: true,
  };
}

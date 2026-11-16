import { listChannels, listGuilds } from "@/lib/mock";
import { type RailGuild, ServerRailNav } from "./server-rail-nav";

const HREF_FALLBACK = "#";

/**
 * サーバーレールのデータ部分（サーバーコンポーネント）。
 * 並びは listGuilds()、遷移先はそのサーバーの先頭テキストチャンネル（無ければ先頭VC）。
 */
export function ServerRail() {
  const guilds: RailGuild[] = listGuilds().map((guild) => {
    const channels = listChannels(guild.id);
    const firstChannel = channels.find((channel) => channel.kind === "text") ?? channels[0];

    return {
      id: guild.id,
      name: guild.name,
      iconColor: guild.iconColor,
      initials: guild.initials,
      href: firstChannel ? `/servers/${guild.id}/channels/${firstChannel.id}` : HREF_FALLBACK,
      unreadCount: guild.channels.reduce((sum, channel) => sum + (channel.unreadCount ?? 0), 0),
      mentionCount: guild.channels.reduce((sum, channel) => sum + (channel.mentionCount ?? 0), 0),
    };
  });

  return <ServerRailNav guilds={guilds} />;
}

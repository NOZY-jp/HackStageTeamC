import { listChannels, listGuilds } from "@/lib/discord-like";
import { type RailGuild, ServerRailNav } from "./server-rail-nav";

const HREF_FALLBACK = "#";

/** sRGB の相対輝度（WCAG 2.x）。 */
const relativeLuminance = (hex: string): number => {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

/**
 * iconColor 上でコントラストが高くなる方の文字色を選ぶ（どちらも WCAG AA の 4.5:1 以上）。
 * 黒のコントラストは (L + 0.05) / 0.05、白は 1.05 / (L + 0.05)。
 */
const initialsTone = (iconColor: string): "dark" | "light" => {
  const luminance = relativeLuminance(iconColor);
  const darkRatio = (luminance + 0.05) / 0.05;
  const lightRatio = 1.05 / (luminance + 0.05);
  return darkRatio >= lightRatio ? "dark" : "light";
};

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
      initialsTone: initialsTone(guild.iconColor),
      href: firstChannel ? `/servers/${guild.id}/channels/${firstChannel.id}` : HREF_FALLBACK,
      unreadCount: guild.channels.reduce((sum, channel) => sum + (channel.unreadCount ?? 0), 0),
      mentionCount: guild.channels.reduce((sum, channel) => sum + (channel.mentionCount ?? 0), 0),
    };
  });

  return <ServerRailNav guilds={guilds} />;
}

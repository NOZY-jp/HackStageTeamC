import { redirect } from "next/navigation";
import { guildChannelPath } from "@/lib/platform/app-prefix";
import { MHC_GUILD_URL_ID, NIGHT_VC_URL_ID } from "@/lib/story/places";

/** ゲームの入口。Discord の「深夜の集会」ボイスチャンネルへ送り、序章を開始する。 */
export default function RootPage() {
  redirect(`${guildChannelPath(MHC_GUILD_URL_ID, NIGHT_VC_URL_ID)}?start=1`);
}

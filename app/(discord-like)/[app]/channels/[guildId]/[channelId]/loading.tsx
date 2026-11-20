import { MessageLoadingSkeleton } from "@/components/discord-like/message-loading-skeleton";

/**
 * チャンネル／DM の切替中はメッセージ欄だけをスケルトンにする（#70）。
 * 左の一覧は [guildId]/layout.tsx が持つので置き換わらない。
 */
export default function ChannelLoading() {
  return <MessageLoadingSkeleton />;
}

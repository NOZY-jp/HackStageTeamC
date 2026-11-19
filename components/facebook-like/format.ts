import type { FbReactionCounts, FbReactionType } from "@/lib/facebook-like/types";

export const REACTION_META: Record<FbReactionType, { label: string; emoji: string }> = {
  like: { label: "いいね！", emoji: "👍" },
  love: { label: "超いいね！", emoji: "❤️" },
  haha: { label: "うけるね", emoji: "😆" },
  wow: { label: "すごいね", emoji: "😮" },
  sad: { label: "悲しいね", emoji: "😢" },
  angry: { label: "ひどいね", emoji: "😡" },
};

/** ISO 8601 日時を「YYYY/MM/DD HH:mm」形式で返す（SSR とクライアントで一致させる） */
export function formatFbDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

export function getTotalReactionCount(reactions: FbReactionCounts): number {
  return Object.values(reactions).reduce((sum, count) => sum + (count ?? 0), 0);
}

export function getTopReactionEmojis(reactions: FbReactionCounts, limit = 3): string[] {
  return (Object.entries(reactions) as [FbReactionType, number | undefined][])
    .filter(([, count]) => (count ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, limit)
    .map(([type]) => REACTION_META[type].emoji);
}

export function getInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return "?";
  }
  return trimmed.slice(0, 2);
}

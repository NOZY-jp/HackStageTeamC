import type { FlagId } from "@/lib/story";

/**
 * talkup で本人を確かめられる条件（#119）。
 * カイの連絡（順序9）の後で、検索結果に本人（u40）が出ているときだけ。
 */
export function canConfirmTalkup(
  flags: readonly FlagId[],
  matchedUserIds: readonly string[],
): boolean {
  return flags.includes("s09-kai-contact") && matchedUserIds.includes("u40");
}

import type { FlagId } from "@/lib/story";

/**
 * talkup で本人を確かめられる条件（#119）。
 * カイの連絡（順序9）の後で、検索結果に本人（u40）が出ているときだけ。
 */
export function canConfirmTalkup(
  flags: readonly FlagId[],
  matchedUserIds: readonly string[],
): boolean {
  return (
    flags.includes("s07-contest-entry") &&
    flags.includes("s08-real-name") &&
    flags.includes("s09-kai-contact") &&
    matchedUserIds.includes("u40")
  );
}

/** 検索結果から段階8を記録する条件（受賞者を確認済みで、本人 u40 が結果にある） */
export function shouldRecordMatch(
  flags: readonly FlagId[],
  matchedUserIds: readonly string[],
): boolean {
  return flags.includes("s07-contest-entry") && matchedUserIds.includes("u40");
}

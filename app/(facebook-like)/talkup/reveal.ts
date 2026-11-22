import type { FlagId } from "@/lib/story";

/**
 * talkup で本人を確かめられる条件（#119）。
 * カイの連絡（順序9）の後で、検索結果に本人（u40）が出ているときだけ。
 */
export function canConfirmTalkup(
  flags: readonly FlagId[],
  matchedUserIds: readonly string[],
): boolean {
  return hasTalkupPrereqs(flags) && matchedUserIds.includes("u40");
}

/**
 * talkup で本人を確かめられる段階まで進んでいるか（順序7〜9。#275）。
 * プロフィールを開いた時点で段階10を立ててよいかの判定にも使い回す。
 */
export function hasTalkupPrereqs(flags: readonly FlagId[]): boolean {
  return (
    flags.includes("s07-contest-entry") &&
    flags.includes("s08-real-name") &&
    flags.includes("s09-kai-contact")
  );
}

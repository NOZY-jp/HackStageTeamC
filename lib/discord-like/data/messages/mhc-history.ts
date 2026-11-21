import { generateMhcHistory, MHC_HISTORY_SEED } from "../../generators/mhc-history";
import type { Message } from "../../types";

/**
 * mhc の追加履歴（#131・800通）。
 *
 * 中身は `lib/discord-like/generators/mhc-history.ts` が語彙バンク＋文型から生成する。
 * seed 固定なので**同じ入力なら常に同じ結果**（`data-quality.test.ts` の決定性テストで固定）。
 * 既存メッセージの時刻を渡して、全メッセージ横断で sentAt が衝突しないようにする。
 */
export function buildMhcHistory(existingTimes: Iterable<string>): Record<string, Message[]> {
  return generateMhcHistory(MHC_HISTORY_SEED, existingTimes);
}

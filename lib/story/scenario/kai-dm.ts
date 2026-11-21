import { chat } from "../stage";
import type { CharacterId } from "../types";

/** メッセージを読めるよう、長さに応じた間を空けてから次へ進む。 */
export function kaiDm(from: CharacterId, text: string, at: string) {
  return chat("discord:dm-kai", from, text, at, {
    wait: Math.max(3000, Math.min(8000, text.length * 150)),
  });
}

import type { Message } from "@/lib/discord-like/types";

/** 通話履歴の1件（開始と終了のシステムメッセージから作る）。 */
export type CallHistory = {
  /** 開始メッセージのID */
  startId: string;
  /** 終了メッセージのID（対になる終了が無ければ undefined＝不在着信） */
  endId?: string;
  /** 通話の長さ（分）。終了が無ければ undefined */
  minutes?: number;
  /** 応答が無かった（不在着信） */
  missed: boolean;
};

const isStart = (message: Message) => message.body.includes("通話を開始しました");
const isEnd = (message: Message) =>
  message.body.includes("通話を終了しました") || message.body.includes("応答がありませんでした");

/**
 * システムメッセージの並びから通話履歴を作る（純粋関数）。
 * データは変更しない。後で `VoiceSession`（#129）が入ったら、この関数の中だけを差し替える。
 */
export function buildCallHistory(messages: Message[]): CallHistory[] {
  const history: CallHistory[] = [];
  let open: Message | undefined;
  for (const message of messages) {
    if (isStart(message)) {
      if (open) {
        // 終了が来ないまま次の開始（前の通話は不在着信扱い）
        history.push({ startId: open.id, missed: true });
      }
      open = message;
      continue;
    }
    if (isEnd(message) && open) {
      const missed = message.body.includes("応答がありませんでした");
      const minutes = missed
        ? undefined
        : Math.max(1, Math.round((Date.parse(message.sentAt) - Date.parse(open.sentAt)) / 60000));
      history.push({ startId: open.id, endId: message.id, minutes, missed });
      open = undefined;
    }
  }
  if (open) {
    history.push({ startId: open.id, missed: true });
  }
  return history;
}

/** メッセージID → 通話履歴（描画用）。終了メッセージはカードに畳むので non-card 側で消す。 */
export function callHistoryByMessage(messages: Message[]): {
  byId: Map<string, CallHistory>;
  hidden: Set<string>;
} {
  const byId = new Map<string, CallHistory>();
  const hidden = new Set<string>();
  for (const call of buildCallHistory(messages)) {
    byId.set(call.startId, call);
    if (call.endId) {
      hidden.add(call.endId);
    }
  }
  return { byId, hidden };
}

/** カードに出す文言。 */
export function callHistoryLabel(call: CallHistory): string {
  return call.missed ? "不在着信" : `通話 ${call.minutes ?? 0}分`;
}

import type { Message, VoiceSession } from "@/lib/discord-like/types";

/** 通話履歴の1件（開始と終了のシステムメッセージから作る）。 */
export type CallHistory = {
  /** 開始時刻（#129 の VoiceSession へ差し替えやすいよう、IDではなく時刻で持つ） */
  startedAt: string;
  /** 開始メッセージのID */
  startId: string;
  /** 終了メッセージのID（対になる終了が無ければ undefined＝不在着信） */
  endId?: string;
  /** 通話の長さ（分）。終了が無ければ undefined */
  minutes?: number;
  /** 応答が無かった（不在着信） */
  missed: boolean;
};

// システム行だけを対象にする（通常のチャットに同じ文言を書かれてもカードにしない）
const isStart = (message: Message) =>
  message.system === true && message.body.includes("通話を開始しました");
const isEnd = (message: Message) =>
  message.system === true &&
  (message.body.includes("通話を終了しました") || message.body.includes("応答がありませんでした"));

/**
 * システムメッセージの並びから通話履歴を作る（純粋関数）。
 * データは変更しない。後で `VoiceSession`（#129）が入ったら、この関数の中だけを差し替える。
 */
export function buildCallHistory(
  messages: Message[],
  sessions: VoiceSession[] = [],
): CallHistory[] {
  // #149: VoiceSession を正とする（system 行の本文マッチは古いデータ用のフォールバック）
  if (sessions.length > 0) {
    const startByTime = new Map<string, Message>();
    const endByTime = new Map<string, Message>();
    for (const message of messages) {
      if (message.system !== true) continue;
      if (message.body.includes("通話を開始しました")) startByTime.set(message.sentAt, message);
      if (
        message.body.includes("通話を終了しました") ||
        message.body.includes("応答がありませんでした")
      ) {
        endByTime.set(message.sentAt, message);
      }
    }
    return sessions
      .filter((session) => startByTime.has(session.startedAt))
      .map((session) => {
        const start = startByTime.get(session.startedAt) as Message;
        const end = session.endedAt ? endByTime.get(session.endedAt) : undefined;
        const minutes =
          session.endedAt === undefined
            ? undefined
            : Math.max(
                1,
                Math.round((Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 60000),
              );
        return {
          startedAt: session.startedAt,
          startId: start.id,
          ...(end ? { endId: end.id } : {}),
          ...(minutes !== undefined ? { minutes } : {}),
          missed: session.endedReason === "missed",
        };
      });
  }

  const history: CallHistory[] = [];
  let open: Message | undefined;
  for (const message of messages) {
    if (isStart(message)) {
      if (open) {
        // 終了が来ないまま次の開始（前の通話は不在着信扱い）
        history.push({ startedAt: open.sentAt, startId: open.id, missed: true });
      }
      open = message;
      continue;
    }
    if (isEnd(message) && open) {
      const missed = message.body.includes("応答がありませんでした");
      const minutes = missed
        ? undefined
        : Math.max(1, Math.round((Date.parse(message.sentAt) - Date.parse(open.sentAt)) / 60000));
      history.push({
        startedAt: open.sentAt,
        startId: open.id,
        endId: message.id,
        minutes,
        missed,
      });
      open = undefined;
    }
  }
  if (open) {
    history.push({ startedAt: open.sentAt, startId: open.id, missed: true });
  }
  return history;
}

/** メッセージID → 通話履歴（描画用）。終了メッセージはカードに畳むので non-card 側で消す。 */
export function callHistoryByMessage(
  messages: Message[],
  sessions: VoiceSession[] = [],
): {
  byId: Map<string, CallHistory>;
  hidden: Set<string>;
} {
  const byId = new Map<string, CallHistory>();
  const hidden = new Set<string>();
  for (const call of buildCallHistory(messages, sessions)) {
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

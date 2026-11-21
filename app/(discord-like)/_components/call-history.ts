import type { Message, VoiceSession } from "@/lib/discord-like/types";

/** 通話履歴の1件（開始と終了のシステムメッセージから作る）。 */
export type CallHistory = {
  /** 開始時刻（VoiceSession の startedAt と同じ値） */
  startedAt: string;
  /** 開始メッセージのID */
  startId: string;
  /** 終了メッセージのID（不在着信は「応答がありませんでした」のID） */
  endId?: string;
  /** 通話の長さ（分）。不在着信は undefined */
  minutes?: number;
  /** 応答が無かった（不在着信） */
  missed: boolean;
};

// システム行だけを対象にする（通常のチャットに同じ文言を書かれてもカードにしない）
const isStart = (message: Message) =>
  message.system === true && message.body.includes("通話を開始しました");
const isEnd = (message: Message) =>
  message.system === true && message.body.includes("通話を終了しました");
const isMissedRow = (message: Message) =>
  message.system === true && message.body.includes("応答がありませんでした");

/**
 * システム行を「開始＋終了／開始＋応答なし」の組に分ける（畳み込みの基礎）。
 * 開始だけで終了も応答なしも無い行は**データ異常**なので組にしない（カード化しない）。
 */
type RowPair = { start: Message; end?: Message; missedRow?: Message };

function pairSystemRows(messages: Message[]): RowPair[] {
  const pairs: RowPair[] = [];
  let open: Message | undefined;
  for (const message of messages) {
    if (isStart(message)) {
      // 前の開始が未解決のまま次が来たら、その前は組にしない（異常データ）
      open = message;
      continue;
    }
    if (!open) continue;
    if (isEnd(message)) {
      pairs.push({ start: open, end: message });
      open = undefined;
      continue;
    }
    if (isMissedRow(message)) {
      pairs.push({ start: open, missedRow: message });
      open = undefined;
    }
  }
  return pairs;
}

/**
 * 通話履歴を作る（純粋関数）。データは変更しない。
 *
 * - カード化は **VoiceSession の有無に関係なく**システム行の組で行う（同じスレッドで挙動を揃える）
 * - 分・不在着信は、対応する VoiceSession があればそれを正とし、無ければシステム行から求める
 * - 不在着信は `応答がありませんでした` がある場合だけ（開始だけの行はデータ異常）
 */
export function buildCallHistory(
  messages: Message[],
  sessions: VoiceSession[] = [],
): CallHistory[] {
  const sessionByStart = new Map<string, VoiceSession>();
  for (const session of sessions) sessionByStart.set(session.startedAt, session);

  const history: CallHistory[] = [];
  for (const pair of pairSystemRows(messages)) {
    const session = sessionByStart.get(pair.start.sentAt);
    const missedRow = pair.missedRow;
    const endRow = pair.end;

    // 不在着信は「応答がありませんでした」がある場合のみ
    const missed = missedRow !== undefined || session?.endedReason === "missed";
    const endedAt = session?.endedAt ?? endRow?.sentAt;
    const minutes =
      missed || endedAt === undefined
        ? undefined
        : Math.max(1, Math.round((Date.parse(endedAt) - Date.parse(pair.start.sentAt)) / 60000));

    history.push({
      startedAt: pair.start.sentAt,
      startId: pair.start.id,
      // 不在着信の行もカードに畳み込むためのID（非表示登録に使う）
      ...(missedRow ? { endId: missedRow.id } : endRow ? { endId: endRow.id } : {}),
      ...(minutes !== undefined ? { minutes } : {}),
      missed,
    });
  }
  return history;
}

/** メッセージID → 通話履歴（描画用）。終了・応答なしの行はカードに畳むので non-card 側で消す。 */
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

/** チャンネルの直近の通話（退出済み）の長さ（分）。無ければ undefined。#150 */
export function lastCallMinutes(sessions: VoiceSession[], channelId: string): number | undefined {
  const ended = sessions
    .filter((session) => session.channelId === channelId && session.endedAt !== undefined)
    .sort((a, b) => (a.endedAt ?? "").localeCompare(b.endedAt ?? ""));
  const last = ended[ended.length - 1];
  if (!last?.endedAt) return undefined;
  return Math.max(1, Math.round((Date.parse(last.endedAt) - Date.parse(last.startedAt)) / 60000));
}

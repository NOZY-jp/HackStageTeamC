import { describe, expect, it } from "vitest";
import { channelMessages, dmMessages } from "./data/messages";
import { listDMMessages } from "./index";
import type { Message } from "./types";

const messages = [...Object.values(channelMessages).flat(), ...Object.values(dmMessages).flat()];
const byContainer = (list: Message[]) => {
  const containers = new Map<string, Message[]>();
  for (const message of list) {
    const entries = containers.get(message.channelId) ?? [];
    entries.push(message);
    containers.set(message.channelId, entries);
  }
  return containers;
};

describe("会話の時刻・人物設定", () => {
  it("各通話は1分〜6時間で、スレッド単位でも開始と終了が対になっている", () => {
    const byThread = byContainer(
      messages.filter(
        (message) =>
          message.system === true &&
          (message.body.includes("通話を開始") ||
            message.body.includes("通話を終了") ||
            message.body.includes("応答がありませんでした")),
      ),
    );
    expect(byThread.size).toBeGreaterThan(0);
    for (const [thread, list] of byThread) {
      let open: Message | undefined;
      for (const message of list) {
        if (message.body.includes("通話を開始")) {
          // 開始の連続は浮き（前の通話が終わっていない）
          expect(open, `${thread}: 開始が連続`).toBeUndefined();
          open = message;
          continue;
        }
        // 終了・不在着信は開始と対でだけ現れる
        if (!open) {
          throw new Error(`${thread}: 開始なしの終了 ${message.id}`);
        }
        const minutes = (Date.parse(message.sentAt) - Date.parse(open.sentAt)) / 60000;
        expect(minutes, `${thread}: 通話の長さ`).toBeGreaterThanOrEqual(1);
        expect(minutes, `${thread}: 通話の長さ`).toBeLessThanOrEqual(6 * 60);
        open = undefined;
      }
      expect(open, `${thread}: 開始だけで終了が無い`).toBeUndefined();
    }
  });

  it("メッセージは有効な日本時間で記録する", () => {
    for (const message of messages) {
      expect(message.sentAt, message.id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/);
      const date = new Date(message.sentAt);
      expect(date.getTime(), message.id).not.toBeNaN();
      const local = new Date(date.getTime() + 9 * 3600_000).toISOString().slice(0, 19);
      expect(local, message.id).toBe(message.sentAt.slice(0, 19));
    }
  });

  it("MaiMai の最後の返信は11月19日21:47", () => {
    const replies = (dmMessages["dm-maimai"] ?? []).filter(
      (message) => message.authorId === "maimai" && message.system !== true,
    );
    expect(replies.at(-1)?.sentAt).toBe("2026-11-19T21:47:00+09:00");
  });

  it("カイとのやり取りは月6日まで", () => {
    // カイとの DM（依頼主）は月6回まで
    // 「回」＝会話の機会（日）。通数ではなく、月あたりの発言日数で見る
    const kai = listDMMessages({ threadId: "dm-kai", limit: 5000 }).messages;
    const daysPerMonth = new Map<string, Set<string>>();
    for (const message of kai) {
      const month = message.sentAt.slice(0, 7);
      const days = daysPerMonth.get(month) ?? new Set<string>();
      days.add(message.sentAt.slice(0, 10));
      daysPerMonth.set(month, days);
    }
    for (const [month, days] of daysPerMonth) {
      expect(days.size, `dm-kai ${month}`).toBeLessThanOrEqual(6);
    }
  });

  it("ネットで知り合った人物同士のログに本名を出さない", () => {
    const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
    const forbiddenMaimaiNames = [
      word(0x670d, 0x90e8, 0x7531, 0x6bd4),
      word(0x7531, 0x6bd4),
      word(0x3086, 0x3044, 0x3061, 0x3083, 0x3093),
      word(0x3086, 0x3063, 0x3061, 0x3083, 0x3093),
    ];
    const forbiddenKohakuNames = [word(0x6749, 0x6d66), word(0x30ea, 0x30e7, 0x30a6)];
    for (const message of messages) {
      for (const term of forbiddenMaimaiNames) {
        expect(message.body, message.id).not.toContain(term);
      }
      const onlineConversation =
        message.channelId.startsWith("mhc-") ||
        ["dm-maimai", "dm-kai", "dm-gunlance"].includes(message.channelId);
      if (onlineConversation) {
        for (const term of forbiddenKohakuNames) {
          expect(message.body, message.id).not.toContain(term);
        }
      }
    }
  });
});

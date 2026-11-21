import { describe, expect, it } from "vitest";
import { listDMMessages, listDMThreads } from "./index";

/**
 * #202 第3版: 会話のリズム（沈黙と再開）。
 * 追加データは前提にせず、いまの台本が「毎日連投」でも「放置」でもないことを見る。
 * 21日以上の沈黙は許容する（検査しない）。
 */

const messagesOf = (threadId: string) =>
  listDMMessages({ threadId, limit: 9000 }).messages.filter((message) => message.system !== true);

type Gap = {
  days: number;
  nextBody: string;
  nextId: string;
  nextAuthor: string;
  prevAuthor: string;
};

const gapsOf = (threadId: string): Gap[] => {
  const messages = messagesOf(threadId);
  const gaps: Gap[] = [];
  for (let i = 1; i < messages.length; i += 1) {
    gaps.push({
      days: (Date.parse(messages[i].sentAt) - Date.parse(messages[i - 1].sentAt)) / 86400000,
      nextBody: messages[i].body,
      nextId: messages[i].id,
      nextAuthor: messages[i].authorId,
      prevAuthor: messages[i - 1].authorId,
    });
  }
  return gaps;
};

const longGapCount = (threadId: string) => gapsOf(threadId).filter((gap) => gap.days >= 3).length;

/** 返事が止まったあとの第一声。挨拶・謝罪・報告・写真・生存確認のどれかで始まる */
const RESTART =
  /おはよう|こんばんは|おやすみ|久しぶり|ひさしぶり|元気|生きて|ごめん|すみません|遅れ|報告|写真|ただいま|おかえり|連絡|復帰|返事|心配/;

describe("会話のリズム（#202）", () => {
  it("どのスレッドも毎日連投ではない（3日以上の沈黙が1回以上ある）", () => {
    for (const thread of listDMThreads()) {
      expect(longGapCount(thread.id), thread.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("恋人・用件・学科・リア友のそれぞれに、3日以上の沈黙が下限以上ある", () => {
    expect(longGapCount("dm-maimai"), "恋人").toBeGreaterThanOrEqual(15);
    expect(longGapCount("dm-kai"), "用件").toBeGreaterThanOrEqual(8);
    const univ = ["dm-yama", "dm-hayashi", "dm-ootsuka"].reduce(
      (sum, threadId) => sum + longGapCount(threadId),
      0,
    );
    expect(univ, "学科").toBeGreaterThanOrEqual(10);
    const friends = ["dm-taku", "dm-jun", "dm-miyu", "dm-gunlance"].reduce(
      (sum, threadId) => sum + longGapCount(threadId),
      0,
    );
    expect(friends, "リア友").toBeGreaterThanOrEqual(8);
  });

  it("7日以上空いたあと、相手から始まる第一声は再開の合図になっている", () => {
    const bad: string[] = [];
    for (const thread of listDMThreads()) {
      for (const gap of gapsOf(thread.id)) {
        if (gap.days < 7) continue;
        // 自分の返事（相槌）は相手の発言への応答なので、再開の第一声としては数えない
        if (gap.nextAuthor === gap.prevAuthor) continue;
        if ([...gap.nextBody].length < 6) continue;
        if (!RESTART.test(gap.nextBody)) bad.push(`${gap.nextId} ${gap.nextBody}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

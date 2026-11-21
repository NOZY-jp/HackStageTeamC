import { describe, expect, it } from "vitest";
import { GAME_NOW } from "@/lib/platform/game-time";
import { channelMessages, dmMessages } from "./data/messages";
import { listDMMessages, listDMThreads } from "./index";

/**
 * 台本の精度（#181）。密度ではなく、関係ごとの振る舞いが数値で説明できるかを見る。
 * しきい値は実測をもとに、関係の差が出る範囲だけを固定する（水増しを許さない）。
 */

const dm = (threadId: string) =>
  listDMMessages({ threadId, limit: 6000 }).messages.filter((message) => message.system !== true);

/** 相手が変わるまでの待ち時間（分） */
function replyGaps(threadId: string): number[] {
  const messages = dm(threadId);
  const gaps: number[] = [];
  for (let i = 1; i < messages.length; i += 1) {
    if (messages[i].authorId === messages[i - 1].authorId) continue;
    gaps.push((Date.parse(messages[i].sentAt) - Date.parse(messages[i - 1].sentAt)) / 60000);
  }
  return gaps.sort((a, b) => a - b);
}

const quantile = (values: number[], p: number) =>
  values[Math.min(values.length - 1, Math.floor(values.length * p))] ?? 0;

const averageLength = (list: { body: string }[]) =>
  list.reduce((sum, message) => sum + [...message.body].length, 0) / Math.max(1, list.length);

describe("精度① 返信の待ち時間は関係ごとに違う（#181）", () => {
  it("恋人（MaiMai）は分単位で返し、中央値もP90も短い", () => {
    const gaps = replyGaps("dm-maimai");
    expect(gaps.length).toBeGreaterThan(100);
    expect(quantile(gaps, 0.5)).toBeLessThanOrEqual(8);
    expect(quantile(gaps, 0.9)).toBeLessThanOrEqual(60);
  });

  it("カイは用件のあるときだけ返し、時間単位まで空く", () => {
    const gaps = replyGaps("dm-kai");
    expect(gaps.length).toBeGreaterThan(10);
    expect(quantile(gaps, 0.9)).toBeGreaterThanOrEqual(10);
    expect(quantile(gaps, 0.9)).toBeLessThanOrEqual(240);
  });

  it("リア友は日単位で返す（学科の同級生より遅い）", () => {
    for (const threadId of ["dm-taku", "dm-jun", "dm-miyu"]) {
      const gaps = replyGaps(threadId);
      expect(gaps.length, threadId).toBeGreaterThan(5);
      expect(quantile(gaps, 0.9), threadId).toBeGreaterThanOrEqual(300);
    }
  });
});

describe("精度② 文体の指紋で関係の温度差が出る（#181）", () => {
  it("カイは丁寧で長く、短文の相手は短い（関係で文長が変わる）", () => {
    const kai = dm("dm-kai");
    const jun = dm("dm-jun");
    const univ = channelMessages["univ-chat"];
    expect(averageLength(kai)).toBeGreaterThan(averageLength(dm("dm-maimai")));
    expect(averageLength(kai)).toBeGreaterThan(averageLength(univ));
    expect(averageLength(univ)).toBeGreaterThan(averageLength(jun));
  });

  it("句読点の使い方が相手で変わる（カイは「。」、MaiMaiは少ない）", () => {
    const periodRate = (list: { body: string }[]) =>
      list.filter((message) => message.body.includes("。")).length / Math.max(1, list.length);
    expect(periodRate(dm("dm-kai"))).toBeGreaterThan(periodRate(dm("dm-maimai")));
  });

  it("「w」「笑」は砕けた相手にだけ出る", () => {
    const count = (list: { body: string }[], pattern: RegExp) =>
      list.filter((message) => pattern.test(message.body)).length;
    const maimai = dm("dm-maimai");
    const kai = dm("dm-kai");
    expect(count(maimai, /[wｗ]|笑/)).toBeGreaterThan(0);
    expect(count(kai, /[wｗ]|笑/)).toBeLessThan(count(maimai, /[wｗ]|笑/));
  });
});

describe("精度③ 話題が続く（3ターン以内の再出現・孤立話題の上限）（#181）", () => {
  const STOP = new Set([
    "です",
    "ます",
    "これ",
    "それ",
    "あれ",
    "今日",
    "明日",
    "昨日",
    "自分",
    "相手",
    "こと",
    "もの",
    "よう",
    "ところ",
    "ちゃん",
    "さん",
    "けど",
    "から",
    "まで",
    "じゃ",
    "そう",
  ]);
  const words = (body: string) =>
    (body.match(/[ァ-ヶー]{2,}|[一-龠]{2,}/g) ?? []).filter((word) => !STOP.has(word));

  /** 45分以内に続く発言を1つのバーストとして、話題語の再出現を見る */
  function burstStats(list: { body: string; sentAt: string; system?: boolean }[]) {
    let bursts = 0;
    let linked = 0;
    let group: typeof list = [];
    const flush = () => {
      const spoken = group.filter((message) => message.system !== true);
      if (spoken.length >= 4) {
        bursts += 1;
        const found = spoken.map((message) => words(message.body));
        const repeat = found.some((wordList, index) =>
          wordList.some((word) =>
            found
              .slice(Math.max(0, index - 3), index)
              .flat()
              .includes(word),
          ),
        );
        if (repeat) linked += 1;
      }
      group = [];
    };
    for (const message of list) {
      const previous = group.at(-1);
      if (previous && Date.parse(message.sentAt) - Date.parse(previous.sentAt) > 45 * 60000) {
        flush();
      }
      group.push(message);
    }
    flush();
    return { bursts, linked };
  }

  it("チャンネル・DMのどれでも、バーストの一定割合で話題語が3ターン以内に戻る", () => {
    const all = [...Object.values(channelMessages), ...Object.values(dmMessages)];
    let bursts = 0;
    let linked = 0;
    for (const list of all) {
      const stats = burstStats(list);
      bursts += stats.bursts;
      linked += stats.linked;
    }
    expect(bursts).toBeGreaterThan(300);
    expect(linked / bursts).toBeGreaterThanOrEqual(0.18);
    // 孤立した話題（誰も拾わない話）は少数に抑える
    expect(1 - linked / bursts).toBeLessThanOrEqual(0.82);
  });
});

describe("精度④ 既読は最後の送信者から自動で決まる（#181）", () => {
  it("最後が自分なら0、相手なら1以上（手書き値を持たない）", () => {
    for (const thread of listDMThreads()) {
      const messages = listDMMessages({ threadId: thread.id, limit: 6000 }).messages;
      const last = messages.at(-1);
      if (!last) continue;
      if (last.authorId === "hal") {
        expect(thread.unreadCount, thread.id).toBe(0);
      } else {
        expect(thread.unreadCount, thread.id).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("精度⑤ 時系列は単調で、すべてGAME_NOWより前（#181）", () => {
  it("各チャンネル・DMの中で時刻が昇順", () => {
    for (const [channelId, list] of Object.entries({ ...channelMessages, ...dmMessages })) {
      for (let i = 1; i < list.length; i += 1) {
        expect(Date.parse(list[i].sentAt), `${channelId}: ${list[i].id}`).toBeGreaterThanOrEqual(
          Date.parse(list[i - 1].sentAt),
        );
      }
    }
  });

  it("すべてのメッセージがGAME_NOWより前", () => {
    const now = Date.parse(GAME_NOW);
    for (const list of [...Object.values(channelMessages), ...Object.values(dmMessages)]) {
      for (const message of list) {
        expect(Date.parse(message.sentAt), message.id).toBeLessThan(now);
      }
    }
  });
});

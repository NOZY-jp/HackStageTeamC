import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { channelMessages, dmMessages } from "./data/messages";
import { listDMMessages } from "./index";
import { NATURALNESS_LIMITS as N } from "./test-thresholds";
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
      word(0x670d, 0x90e8),
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

/** チャンネル／DMスレッドごとの、時系列の並び（バーストを切る単位） */
const byChannel = byContainer(messages);

/** バースト: 隣り合う発言の間隔が burstWindowMinutes 以内で続くひとかたまり */
const burstsOf = (list: Message[]): Message[][] => {
  const bursts: Message[][] = [];
  for (const message of list) {
    const current = bursts.at(-1);
    const previous = current?.at(-1);
    const gap = previous
      ? (Date.parse(message.sentAt) - Date.parse(previous.sentAt)) / 60000
      : Number.POSITIVE_INFINITY;
    if (current && gap <= N.burstWindowMinutes) {
      current.push(message);
    } else {
      bursts.push([message]);
    }
  }
  return bursts;
};

/**
 * 質問の収集条件（分母を明示）: 文末が ? / ？ のもの、または疑問の終わり方をするもの。
 * システム行（通話の開始/終了）は会話ではないので数えない。
 */
const isQuestion = (body: string) => {
  const text = body.trim();
  if (/[?？]\s*[」』）)]*$/.test(text)) return true;
  return /(ですか|ますか|かな|だろう|どう|どこ|いつ|だれ|誰|なに|何|なんで|どうやって|ありますか|いい|いる|できる)\s*[。]?$/.test(
    text,
  );
};
const spoken = messages.filter((message) => message.system !== true);

describe("会話の自然さ（#154 の6指標）", () => {
  it("① 同じバーストの中で誰も答えない質問は15%以下", () => {
    const questions = messages.filter(
      (message) => message.system !== true && isQuestion(message.body),
    );
    expect(questions.length).toBeGreaterThan(50);
    let unanswered = 0;
    const samples: string[] = [];
    for (const question of questions) {
      const list = byChannel.get(question.channelId) ?? [];
      const index = list.findIndex((message) => message.id === question.id);
      const burst = burstsOf(list).find((group) => group.some((m) => m.id === question.id)) ?? [];
      const position = burst.findIndex((message) => message.id === question.id);
      // 回答は同じバーストの中だけ。システム行は回答に数えない（質問→回答の対応を明示）
      const answer = burst
        .slice(position + 1)
        .find((message) => message.system !== true && message.authorId !== question.authorId);
      void index;
      if (!answer) {
        unanswered += 1;
        samples.push(`${question.id} ${question.body}`);
      }
    }
    const ratio = unanswered / questions.length;
    expect(ratio, samples.slice(0, 5).join(" / ")).toBeLessThanOrEqual(N.unansweredQuestionRatio);
  });

  it("② 評価語だけの単独発言は、チャンネルごとに1回まで", () => {
    const standalone =
      /^(たしかに|確かに|わかる|なるほど|いいと思う|そうだね|それな|すごい|やばい|草|www)[。！!…\s]*$/;
    const counts = new Map<string, string[]>();
    for (const message of messages) {
      if (standalone.test(message.body.trim())) {
        counts.set(message.channelId, [...(counts.get(message.channelId) ?? []), message.id]);
      }
    }
    for (const [channelId, ids] of counts) {
      expect(ids.length, `${channelId}: ${ids.join(", ")}`).toBeLessThanOrEqual(
        N.standaloneReactionPerChannel,
      );
    }
  });

  it("③ 3通以上のバーストが6割以上で、隣接する発言の間隔の中央値は10分未満", () => {
    const spokenByChannel = new Map<string, Message[]>(
      [...byChannel.entries()].map(([key, list]) => [key, list.filter((m) => m.system !== true)]),
    );
    const allBursts = [...spokenByChannel.values()].flatMap(burstsOf);
    const inLongBursts = allBursts
      .filter((burst) => burst.length >= N.burstMinMessages)
      .reduce((sum, burst) => sum + burst.length, 0);
    expect(inLongBursts / spoken.length).toBeGreaterThanOrEqual(N.burstMessageRatio);

    const gaps = [...spokenByChannel.values()]
      .flatMap((list) =>
        list.slice(1).map((m, i) => (Date.parse(m.sentAt) - Date.parse(list[i].sentAt)) / 60000),
      )
      .filter((minutes) => minutes <= N.burstWindowMinutes)
      .sort((a, b) => a - b);
    expect(gaps.length).toBeGreaterThan(100);
    expect(gaps[Math.floor(gaps.length / 2)]).toBeLessThan(N.medianGapMinutes);
  });

  it("④ 時刻と内容が合っている（おはよう・おやすみ・出勤）", () => {
    const hourOf = (sentAt: string) => Number(sentAt.slice(11, 13));
    const problems: string[] = [];
    for (const message of messages) {
      const hour = hourOf(message.sentAt);
      if (message.body.includes("おはよう") && (hour < N.morning.from || hour > N.morning.to)) {
        problems.push(`おはよう ${message.id} ${hour}時`);
      }
      if (message.body.includes("おやすみ") && !(hour >= N.night.from || hour <= N.night.to - 24)) {
        problems.push(`おやすみ ${message.id} ${hour}時`);
      }
      if (/仕事行って|会社行って|学校行って|授業行って/.test(message.body)) {
        const date = new Date(message.sentAt);
        const weekday = date.getUTCDay();
        const jstWeekday = new Date(date.getTime() + 9 * 3600_000).getUTCDay();
        if (jstWeekday === 0 || jstWeekday === 6) {
          problems.push(`休日に通勤 ${message.id}`);
        }
        if (hour < N.commute.from || hour > N.commute.to) {
          problems.push(`通勤の時刻 ${message.id} ${hour}時`);
        }
        void weekday;
      }
    }
    expect(problems).toEqual([]);
  });

  it("⑤ 呼称は docs/discord/03-people.md の表に従う", () => {
    const doc = readFileSync(resolve(process.cwd(), N.peopleDoc), "utf8");
    const row = doc.split("\n").find((line) => /^\|\s*`maimai`/.test(line));
    if (!row) throw new Error("03-people.md に maimai の行がありません");
    const names = [...row.matchAll(/「([^」]+)」/g)].map((match) => match[1]);
    // 表の「hal→相手 / 相手→hal」の順に並ぶ（MaiMai は「琥珀さん」→「琥珀」）
    expect(names[0]).toBe("まいまい");
    expect(names).toContain("琥珀");
    const fromHal = "まいまい";
    const fromMaimai = "琥珀";

    const maimaiDm = byChannel.get("dm-maimai") ?? [];
    expect(maimaiDm.some((m) => m.authorId === "hal" && m.body.includes(fromHal))).toBe(true);
    expect(maimaiDm.some((m) => m.authorId === "maimai" && m.body.includes(fromMaimai))).toBe(true);
    // 本名は、本名を知らない相手との会話には出さない
    for (const message of messages) {
      const knowsRealName =
        !["dm-maimai", "dm-kai", "dm-gunlance"].includes(message.channelId) &&
        !message.channelId.startsWith("mhc-");
      if (!knowsRealName) {
        expect(message.body, message.id).not.toContain("リョウ");
      }
    }
  });

  it("⑥ モンスター・装備の表記ゆれが無い", () => {
    const canonical = ["タマミツネ", "バーラハーラ", "双剣", "弓", "ヘッドセット"];
    const variants = ["たまみつね", "ばーらはーら", "そうけん", "ゆみ", "へっどせっと"];
    const text = messages.map((message) => message.body).join("\n");
    for (const name of canonical) {
      expect(text, name).toContain(name);
    }
    for (const variant of variants) {
      expect(text, variant).not.toContain(variant);
    }
  });

  it("廃止した旧呼び名はデータに0件、本名は結末以外に出さない", () => {
    // 「ハルカ」は別の人物なので除外する
    const oldName = /ハル(?!カ)/;
    const hits = messages.filter((message) => oldName.test(message.body));
    expect(hits.map((message) => message.id)).toEqual([]);

    const realName = messages.filter((message) => message.body.includes("リョウ"));
    expect(realName.length).toBeLessThanOrEqual(1);
  });
});

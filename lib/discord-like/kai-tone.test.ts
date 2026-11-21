import { describe, expect, it } from "vitest";
import { dmMessages } from "./data/messages";

/**
 * #210: カイの DM はゲーム中の本人と同じ口調（常体・「俺」・砕けた語尾）。
 * 敬語を残すのは初対面の数通だけ。
 */

// 対象は dm-scripts.ts の台本（固定IDの手がかり場面は物語側の文面なので触らない）
const kai = (dmMessages["dm-kai"] ?? []).filter(
  (message) => message.authorId === "kai" && /^dm-kai-\d{4}-\d{2}-\d{2}-/.test(message.id),
);
const POLITE = /ます|ません|ください|です|でしょうか|ましょう/;

describe("カイのDMの口調（#210）", () => {
  it("初対面の3通だけ敬語で、それ以降は常体", () => {
    expect(kai.length).toBeGreaterThan(30);
    for (const message of kai.slice(0, 3)) {
      expect(message.body, message.id).toMatch(POLITE);
    }
    const bad = kai.slice(3).filter((message) => POLITE.test(message.body));
    expect(bad.map((message) => `${message.id} ${message.body}`)).toEqual([]);
  });

  it("一人称は「俺」を使う", () => {
    expect(kai.some((message) => message.body.includes("俺"))).toBe(true);
    expect(kai.some((message) => message.body.includes("私"))).toBe(false);
  });
});

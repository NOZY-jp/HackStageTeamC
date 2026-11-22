import { describe, expect, it } from "vitest";
import { twitterPosts, twitterUsers } from "./data/twitter";

/**
 * #248（ターンA）: 検索で絞れるだけのアカウントと投稿がある。
 * 本文は生成器で作るが、完全一致と書き出しの偏りをテストで抑える。
 */

const topLevel = twitterPosts.filter((post) => !post.replyToId);
const replies = twitterPosts.filter((post) => post.replyToId);
const CLUES = [
  "モンハン",
  "狩猟",
  "レイド",
  "双剣",
  "大剣",
  "太刀",
  "ブログ",
  "弓",
  "写真コンテスト",
  "でんでん",
  "ストーカー",
  "集会所",
  "装備",
  "カメラ",
  "喫茶店",
  "レポート",
  "就活",
];

describe("Twixer のデータ規模（#248）", () => {
  it("アカウント200人以上・投稿2,000件以上", () => {
    expect(twitterUsers.length).toBeGreaterThanOrEqual(200);
    expect(twitterPosts.length).toBeGreaterThanOrEqual(2000);
  });

  it("手がかり語ごとに投稿が20件以上ある", () => {
    for (const clue of CLUES) {
      expect(
        topLevel.filter((post) => post.body.includes(clue)).length,
        clue,
      ).toBeGreaterThanOrEqual(20);
    }
  });

  it("本文の完全一致がなく、書き出し20字の重複率が10%以下（返信を含む全投稿）", () => {
    // 返信も会話として読まれるため、親投稿だけでなく全投稿で重複を禁じる（#248 PM指摘）
    const bodies = twitterPosts.map((post) => post.body.replace(/\s+/g, ""));
    expect(new Set(bodies).size).toBe(bodies.length);
    const openers = new Map<string, number>();
    for (const body of bodies) {
      const opener = [...body].slice(0, 20).join("");
      openers.set(opener, (openers.get(opener) ?? 0) + 1);
    }
    const max = Math.max(...openers.values());
    expect(max / bodies.length).toBeLessThanOrEqual(0.1);
  });

  it("返信150件以上・親40件以上で、replyCount が実返信件数と一致", () => {
    expect(replies.length).toBeGreaterThanOrEqual(150);
    expect(new Set(replies.map((reply) => reply.replyToId)).size).toBeGreaterThanOrEqual(40);
    for (const post of twitterPosts) {
      expect(post.replyCount, post.id).toBe(
        twitterPosts.filter((candidate) => candidate.replyToId === post.id).length,
      );
    }
  });
});

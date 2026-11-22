import { describe, expect, it } from "vitest";
import { twitterPosts, twitterProfiles, twitterUsers } from "./data/twitter";

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

describe("返信の質と物語データの不変（#248）", () => {
  const nounsOf = (body: string): string[] => body.match(/[ァ-ー]{3,}|[一-鿿]{2,6}/g) ?? [];
  const generatedReplies = replies.filter((reply) => reply.id.startsWith("reply-"));
  const parentBody = new Map(twitterPosts.map((post) => [post.id, post.body]));

  it("生成した返信は親の本文の語を受けて書かれている", () => {
    const withNouns = generatedReplies.filter(
      (reply) => nounsOf(parentBody.get(reply.replyToId ?? "") ?? "").length > 0,
    );
    const responsive = withNouns.filter((reply) => {
      const words = nounsOf(parentBody.get(reply.replyToId ?? "") ?? "");
      return words.some((word) => reply.body.includes(word));
    });
    expect(generatedReplies.length).toBeGreaterThanOrEqual(150);
    expect(responsive.length / withNouns.length).toBeGreaterThanOrEqual(0.95);
  });

  it("鍵垢の投稿を返信の親にせず、本文の語も返信に出さない", () => {
    const protectedIds = new Set(
      twitterUsers.filter((user) => user.protected).map((user) => user.id),
    );
    const protectedPosts = twitterPosts.filter((post) => protectedIds.has(post.authorId));
    // 生成した返信の親だけを見る（物語側の返信 post-202 などは元からある）
    const parentIds = new Set(generatedReplies.map((reply) => reply.replyToId));
    for (const post of protectedPosts) {
      expect(parentIds.has(post.id), post.id).toBe(false);
    }
    const replyText = replies.map((reply) => reply.body).join(String.fromCharCode(10));
    expect(replyText).not.toContain("モンスターハンターワールド");
  });

  it("物語の投稿と旧垢の bio は変えない", () => {
    const byId = new Map(twitterPosts.map((post) => [post.id, post]));
    expect(byId.get("post-101")?.body).toMatchInlineSnapshot(
      `"弓の属性装備、スキル枠がかつかつでどれ削るか悩む…"`,
    );
    expect(byId.get("post-102")?.body).toMatchInlineSnapshot(
      `"この立ち回り、まいまいが前のブログで書いてた弓属性強化ガン積み構成のやつより楽じゃない？"`,
    );
    expect(byId.get("post-105")?.body).toMatchInlineSnapshot(
      `"友達がストーカーされてるっぽくてガチやばいー、最近物騒ー。昔のアカウントまで掘られてたとか怖すぎるし、みんなも気をつけよ……"`,
    );
    expect(
      twitterProfiles.find((profile) => profile.userId === "tw-old-denden")?.bio,
    ).toMatchInlineSnapshot(
      `"前は @hunter_denden0102（hunter_denden って名前だった）。「写真コンテストで賞をもらいました！」書いた人。BFF: @kanon__dayo"`,
    );
  });
});

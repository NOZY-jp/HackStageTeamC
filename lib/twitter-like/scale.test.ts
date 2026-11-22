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

  it("量産投稿には「でんでん」「ストーカー」を出さない（手がかりの重みを守る）", () => {
    const generated = topLevel.filter((post) => post.authorId.startsWith("tw-gen-"));
    expect(
      generated.some((post) => post.body.includes("でんでん")),
      "でんでん",
    ).toBe(false);
    expect(
      generated.some((post) => post.body.includes("ストーカー")),
      "ストーカー",
    ).toBe(false);
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
  const generatedReplies = replies.filter((reply) => reply.id.startsWith("reply-"));
  const parentBody = new Map(twitterPosts.map((post) => [post.id, post.body]));

  /**
   * 親の本文の語を拾う。**2文字以上**の語だけを見る（1字の偶然一致を通さないため）。
   * ひらがなだけの語（でんでん等）は4文字の窓で拾い、意味の薄い語は除く。
   */
  const STOPWORDS = new Set(["今日", "明日", "昨日", "自分", "時間", "最近", "最初"]);
  const wordsOf = (text: string): string[] => {
    const words: string[] = Array.from(text.match(/[ァ-ー]{2,}|[一-鿿]{2,}/g) ?? []).filter(
      (word) => !STOPWORDS.has(word) && !/^[ぁ-ん]+$/.test(word),
    );
    for (let i = 0; i + 4 <= text.length; i += 1) {
      const window = text.slice(i, i + 4);
      if (/^[ぁ-ん]{4}$/.test(window)) words.push(window);
    }
    return words;
  };
  const quotesParent = (parentBodyText: string, replyBody: string): boolean =>
    wordsOf(parentBodyText).some((word) => replyBody.includes(word));

  it("生成した返信は親の本文の語を受けて書かれている", () => {
    const responsive = generatedReplies.filter((reply) =>
      quotesParent(parentBody.get(reply.replyToId ?? "") ?? "", reply.body),
    );
    expect(generatedReplies.length).toBeGreaterThanOrEqual(150);
    expect(responsive.length / generatedReplies.length).toBeGreaterThanOrEqual(0.95);
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

  it("返信は親と別の人が、親より後に書いている", () => {
    const byId = new Map(twitterPosts.map((post) => [post.id, post]));
    for (const reply of generatedReplies) {
      const parent = byId.get(reply.replyToId ?? "");
      expect(parent, reply.id).toBeDefined();
      expect(reply.authorId, reply.id).not.toBe(parent?.authorId);
      expect(Date.parse(reply.postedAt), reply.id).toBeGreaterThanOrEqual(
        Date.parse(parent?.postedAt ?? ""),
      );
    }
  });

  it("物語の投稿と、かのんの投稿には返信を付けない（先取りを避ける）", () => {
    const storyIds = new Set([
      ...Array.from({ length: 22 }, (_, i) => `post-0${String(i + 2).padStart(2, "0")}`),
      ...Array.from({ length: 9 }, (_, i) => `post-1${String(i + 1).padStart(2, "0")}`).map((id) =>
        id.replace("post-1", "post-1"),
      ),
    ]);
    const byId = new Map(twitterPosts.map((post) => [post.id, post]));
    for (const reply of generatedReplies) {
      const parentId = reply.replyToId ?? "";
      const parent = byId.get(parentId);
      expect(storyIds.has(parentId), parentId).toBe(false);
      expect(parent?.authorId, parentId).not.toBe("tw-kanon");
      expect(parent?.authorId.startsWith("tw-gen"), parentId).toBe(true);
    }
  });

  // 投稿日時は JST（+09:00）で持つ。UTC のまま日付を切ると前日にずれて登録日と比べられない（#273）。
  const jstDate = (iso: string): string =>
    new Date(Date.parse(iso) + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

  it("投稿日時はすべて JST（+09:00）表記", () => {
    for (const post of twitterPosts) {
      expect(post.postedAt.endsWith("+09:00"), post.id).toBe(true);
    }
    expect(twitterPosts.some((post) => post.postedAt.endsWith("+00:00"))).toBe(false);
  });

  it("生成した返信に手がかり語（でんでん・ストーカー）を出さない", () => {
    const generatedReplies = replies.filter((reply) => reply.id.startsWith("reply-"));
    expect(generatedReplies.length).toBeGreaterThanOrEqual(150);
    for (const reply of generatedReplies) {
      expect(reply.body.includes("でんでん"), reply.id).toBe(false);
      expect(reply.body.includes("ストーカー"), reply.id).toBe(false);
    }
  });

  it("生成投稿の日時は投稿者の登録日より後で、「〜の話の話」を作らない", () => {
    const joinedAt = new Map(
      twitterProfiles.map((profile) => [profile.userId, profile.joinedAt] as const),
    );
    for (const post of twitterPosts) {
      if (post.authorId.startsWith("tw-gen")) {
        expect(jstDate(post.postedAt) >= (joinedAt.get(post.authorId) ?? ""), post.id).toBe(true);
      }
      expect(post.body.includes("の話の話"), post.id).toBe(false);
    }
  });
});

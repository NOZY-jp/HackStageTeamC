import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { twitterPosts } from "./data/twitter";
import { getPost, listPosts, listReplies } from "./index";

/**
 * #240: 返信の表示が実データと一致する。
 * トップレベル投稿の replyCount は実際の返信件数、返信は十分な数と長さを持つ。
 */

const topLevel = twitterPosts.filter((post) => !post.replyToId);
const replies = twitterPosts.filter((post) => post.replyToId);
const wordOf = (body: string) => (body.match(/[ァ-ヶー]{2,}|[一-龠]{2,}/g) ?? [])[0] ?? "";

describe("Twixer の返信（#240）", () => {
  it("全トップレベル投稿で replyCount が実返信件数と一致する", () => {
    for (const post of topLevel) {
      expect(post.replyCount, post.id).toBe(replies.filter((r) => r.replyToId === post.id).length);
    }
  });

  it("返信は150件以上、返信を持つ投稿は40件以上", () => {
    expect(replies.length).toBeGreaterThanOrEqual(150);
    expect(new Set(replies.map((reply) => reply.replyToId)).size).toBeGreaterThanOrEqual(40);
  });

  it("追加した返信は10文字以上で、返信先の話題語に触れる", () => {
    for (const reply of replies.filter((item) => item.id.startsWith("reply-"))) {
      const parent = getPost(reply.replyToId ?? "");
      const words = parent ? (parent.body.match(/[ァ-ヶー]{2,}|[一-龠]{2,}/g) ?? []) : [];
      expect([...reply.body].length, reply.id).toBeGreaterThanOrEqual(10);
      expect(
        words.some((word) => reply.body.includes(word)),
        `${reply.id} ${reply.body}`,
      ).toBe(true);
    }
  });

  it("post-101/102/105 の本文・日時・返信先は不変", () => {
    const frozen = JSON.parse(
      readFileSync(join(process.cwd(), "lib/twitter-like/critical-posts.snapshot.json"), "utf8"),
    );
    for (const expected of frozen) {
      const actual = getPost(expected.id);
      expect(actual?.body).toBe(expected.body);
      expect(actual?.postedAt).toBe(expected.postedAt);
      expect(actual?.replyToId).toBe(expected.replyToId);
    }
  });

  it("Twitter データに禁止語（でんちゃん・ゆい・ハル）がない", () => {
    const text = JSON.stringify(twitterPosts);
    for (const word of ["でんちゃん", "ゆい", "ハル"]) expect(text).not.toContain(word);
    expect(listPosts().length).toBeGreaterThan(0);
    expect(listReplies("post-003").length).toBeGreaterThan(0);
  });
});

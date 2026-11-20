import { describe, expect, it } from "vitest";
import { fbYuiPosts } from "./posts-yui";

const KNOWN_USER_IDS = new Set([
  "u1",
  "u2",
  "u3",
  "u4",
  "u5",
  "u6",
  "u7",
  "u8",
  "u9",
  "u10",
  "u11",
  "u12",
  "u35",
  "u36",
  "u40",
]);

const ISO_8601_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

describe("fbYuiPosts", () => {
  it("has exactly 20 posts", () => {
    expect(fbYuiPosts).toHaveLength(20);
  });

  it("uses unique ids fbp-301..fbp-320 in order", () => {
    const ids = fbYuiPosts.map((post) => post.id);
    expect(new Set(ids).size).toBe(20);
    expect(ids).toEqual(Array.from({ length: 20 }, (_, i) => `fbp-${301 + i}`));
  });

  it("all posts are authored by u40", () => {
    for (const post of fbYuiPosts) {
      expect(post.authorId).toBe("u40");
    }
  });

  it("has sortable ISO 8601 createdAt values in chronological order", () => {
    const stamps = fbYuiPosts.map((post) => post.createdAt);
    for (const stamp of stamps) {
      expect(stamp).toMatch(ISO_8601_PATTERN);
      expect(Number.isNaN(Date.parse(stamp))).toBe(false);
    }
    const sorted = [...stamps].sort();
    expect(stamps).toEqual(sorted);
  });

  it("stays within the high school era (2018-04-09 .. 2020-12-31)", () => {
    // 2021年の受験以降は更新されない設定。卒業式（2021-03）も範囲外。
    for (const stamp of fbYuiPosts.map((post) => post.createdAt)) {
      expect(stamp >= "2018-04-09T00:00:00Z").toBe(true);
      expect(stamp <= "2020-12-31T23:59:59Z").toBe(true);
    }
  });

  it("has comments whose postId matches the parent post id", () => {
    for (const post of fbYuiPosts) {
      expect(post.comments.length).toBeLessThanOrEqual(2);
      for (const comment of post.comments) {
        expect(comment.postId).toBe(post.id);
        expect(comment.createdAt).toMatch(ISO_8601_PATTERN);
      }
    }
  });

  it("has comment authors within the known user set and never u1", () => {
    for (const post of fbYuiPosts) {
      for (const comment of post.comments) {
        expect(
          KNOWN_USER_IDS.has(comment.authorId),
          `${comment.id} の authorId ${comment.authorId} が既知ユーザーに含まれません`,
        ).toBe(true);
        // 主人公（u1）はまだこのアカウントを知らない
        expect(comment.authorId).not.toBe("u1");
      }
    }
  });
});

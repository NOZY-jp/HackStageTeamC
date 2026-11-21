import { describe, expect, it } from "vitest";
import { listPostsByAuthor } from "../index";
import { fbYuiPosts } from "./posts-yui";

const ISO_8601_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isValidUtcIsoDate(stamp: string): boolean {
  const parsed = Date.parse(stamp);
  if (Number.isNaN(parsed)) {
    return false;
  }
  return `${new Date(parsed).toISOString().slice(0, 19)}Z` === stamp;
}

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

  it("has sortable ISO 8601 createdAt values with valid calendar dates in chronological order", () => {
    const stamps = fbYuiPosts.map((post) => post.createdAt);
    for (const stamp of stamps) {
      expect(stamp).toMatch(ISO_8601_PATTERN);
      expect(isValidUtcIsoDate(stamp), `invalid calendar date: ${stamp}`).toBe(true);
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

  it("has no createdAt collision across all u40 posts including fbp-201..203", () => {
    const u40Posts = listPostsByAuthor("u40");
    expect(u40Posts).toHaveLength(23);
    const stamps = u40Posts.map((post) => post.createdAt);
    expect(new Set(stamps).size).toBe(u40Posts.length);
  });

  it("has valid comments with unique ids, valid calendar dates, and bounds within high school era", () => {
    const commentIds: string[] = [];
    for (const post of fbYuiPosts) {
      expect(post.comments.length).toBeLessThanOrEqual(2);
      for (const comment of post.comments) {
        expect(comment.postId).toBe(post.id);
        expect(comment.createdAt).toMatch(ISO_8601_PATTERN);
        expect(
          isValidUtcIsoDate(comment.createdAt),
          `invalid calendar date: ${comment.createdAt}`,
        ).toBe(true);
        expect(comment.createdAt >= post.createdAt).toBe(true);
        expect(comment.createdAt <= "2020-12-31T23:59:59Z").toBe(true);
        commentIds.push(comment.id);
      }
    }
    expect(new Set(commentIds).size).toBe(commentIds.length);
  });

  it("only allows comments authored by u40 (complete isolation from TeamC)", () => {
    for (const post of fbYuiPosts) {
      for (const comment of post.comments) {
        expect(comment.authorId, `${comment.id} の authorId`).toBe("u40");
      }
    }
  });
});

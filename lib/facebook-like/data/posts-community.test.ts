import { describe, expect, it } from "vitest";
import { fbCommunityPosts } from "./posts-community";
import { fbUsers } from "./users";

const ISO_8601_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

const userIds = new Set(fbUsers.map((u) => u.id));

describe("fbCommunityPosts", () => {
  it("60件あり、id は fbp-401〜fbp-460 で重複しない", () => {
    expect(fbCommunityPosts).toHaveLength(60);
    const ids = fbCommunityPosts.map((p) => p.id);
    expect(new Set(ids).size).toBe(60);
    expect(ids).toEqual(
      expect.arrayContaining(Array.from({ length: 60 }, (_, i) => `fbp-${401 + i}`)),
    );
  });

  it("authorId は users.ts に実在する", () => {
    for (const post of fbCommunityPosts) {
      expect(userIds.has(post.authorId), `unknown author: ${post.authorId}`).toBe(true);
    }
  });

  it("コメントの postId は親投稿の id と一致し、authorId も実在する", () => {
    const commentIds: string[] = [];
    for (const post of fbCommunityPosts) {
      for (const comment of post.comments) {
        expect(comment.postId).toBe(post.id);
        expect(userIds.has(comment.authorId), `unknown comment author: ${comment.authorId}`).toBe(
          true,
        );
        commentIds.push(comment.id);
      }
    }
    // コメント id は fbc-4xx 連番で重複しない
    expect(new Set(commentIds).size).toBe(commentIds.length);
    for (const id of commentIds) {
      expect(id).toMatch(/^fbc-4\d{2}$/);
    }
  });

  it("createdAt は ISO 8601（Z 固定）形式で実在する日時かつ期間内", () => {
    const isValidUtcIsoDate = (stamp: string) => {
      const parsed = Date.parse(stamp);
      if (Number.isNaN(parsed)) return false;
      return `${new Date(parsed).toISOString().slice(0, 19)}Z` === stamp;
    };

    for (const post of fbCommunityPosts) {
      expect(post.createdAt, `bad createdAt on ${post.id}`).toMatch(ISO_8601_Z);
      expect(isValidUtcIsoDate(post.createdAt), `invalid calendar date on ${post.id}`).toBe(true);
      expect(post.createdAt >= "2026-09-01T00:00:00Z").toBe(true);
      expect(post.createdAt <= "2026-11-20T23:59:59Z").toBe(true);
      for (const comment of post.comments) {
        expect(comment.createdAt, `bad createdAt on ${comment.id}`).toMatch(ISO_8601_Z);
        expect(isValidUtcIsoDate(comment.createdAt), `invalid calendar date on ${comment.id}`).toBe(
          true,
        );
        expect(comment.createdAt >= post.createdAt).toBe(true);
      }
    }
  });

  it("投稿者が60件に偏りなく分布している（u40は0件、他の全19人が2〜4件）", () => {
    const counts = new Map<string, number>();
    for (const post of fbCommunityPosts) {
      counts.set(post.authorId, (counts.get(post.authorId) ?? 0) + 1);
    }
    expect(counts.get("u40") ?? 0).toBe(0);
    const communityUsers = fbUsers.filter((u) => u.id !== "u40");
    expect(communityUsers).toHaveLength(19);
    for (const user of communityUsers) {
      const count = counts.get(user.id) ?? 0;
      expect(count, `author ${user.id} has ${count} posts`).toBeGreaterThanOrEqual(2);
      expect(count, `author ${user.id} has ${count} posts`).toBeLessThanOrEqual(4);
    }
  });
});

describe("新規ユーザー u41〜u48", () => {
  const newIds = ["u41", "u42", "u43", "u44", "u45", "u46", "u47", "u48"];

  it("8人とも users.ts に存在する", () => {
    for (const id of newIds) {
      expect(userIds.has(id), `missing user: ${id}`).toBe(true);
    }
    expect(newIds).toHaveLength(8);
  });

  it("u41〜u48 の全員が 2 件以上の投稿を持つ", () => {
    for (const id of newIds) {
      const count = fbCommunityPosts.filter((post) => post.authorId === id).length;
      expect(count, `${id} has ${count} posts`).toBeGreaterThanOrEqual(2);
    }
  });

  it("friendIds は全て users.ts に実在する id を参照し相互・重複なし（u40 を含まない）", () => {
    const newUsers = fbUsers.filter((u) => newIds.includes(u.id));
    expect(newUsers).toHaveLength(8);
    const byId = new Map(fbUsers.map((u) => [u.id, u]));
    for (const user of fbUsers) {
      expect(new Set(user.friendIds).size, `${user.id} has duplicate friendIds`).toBe(
        user.friendIds.length,
      );
      expect(user.friendIds.includes("u40"), `${user.id} should not reference u40`).toBe(false);
      for (const friendId of user.friendIds) {
        expect(userIds.has(friendId), `${user.id} references unknown friend: ${friendId}`).toBe(
          true,
        );
        expect(
          byId.get(friendId)?.friendIds.includes(user.id),
          `${user.id} -> ${friendId} is not symmetric`,
        ).toBe(true);
      }
    }
  });
});

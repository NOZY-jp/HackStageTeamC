import { describe, expect, it } from "vitest";
import {
  getPost,
  getUser,
  getUserByHandle,
  isProtected,
  listPosts,
  listPostsByAuthor,
  listReplies,
  listUsers,
} from "./index";

describe("lib/twitter-like のアクセサ", () => {
  it("listPosts は postedAt 降順で返す", () => {
    const times = listPosts().map((post) => post.postedAt);
    expect(times).toEqual([...times].sort().reverse());
  });

  it("listPostsByAuthor は authorId の投稿だけを返す", () => {
    for (const user of listUsers()) {
      for (const post of listPostsByAuthor(user.id)) {
        expect(post.authorId).toBe(user.id);
      }
    }
  });

  it("存在しないIDでは undefined / 空配列を返す", () => {
    expect(getPost("missing-post")).toBeUndefined();
    expect(getUser("missing-user")).toBeUndefined();
    expect(getUserByHandle("missing-handle")).toBeUndefined();
    expect(listPostsByAuthor("missing-user")).toEqual([]);
    expect(listReplies("missing-post")).toEqual([]);
  });

  it("戻り値を書き換えても内部状態が変わらない（深いコピー）", () => {
    const before = getPost("post-001")?.body;
    const post = getPost("post-001");
    if (post) {
      post.body = "書き換え";
    }
    expect(getPost("post-001")?.body).toBe(before);
  });
});

describe("鍵アカウントの投稿の扱い", () => {
  it("isProtected は protected フラグのあるユーザーだけ true を返す", () => {
    const protectedHandles = listUsers()
      .filter((user) => isProtected(user))
      .map((user) => user.handle);
    expect(protectedHandles).toEqual(["nagi"]);
  });

  it("listPosts / getPost は鍵垢の投稿を公開面に出さない", () => {
    const lockedUser = listUsers().find((user) => isProtected(user));
    const lockedPostIds = listPostsByAuthor(lockedUser?.id ?? "missing-author").map(
      (post) => post.id,
    );
    expect(lockedPostIds.length).toBeGreaterThan(0);

    const visibleIds = listPosts().map((post) => post.id);
    for (const id of lockedPostIds) {
      expect(visibleIds).not.toContain(id);
      expect(getPost(id)).toBeUndefined();
    }
    // 公開アカウントの投稿は従来どおり取れる
    expect(getPost("post-001")).toBeDefined();
  });

  it("listReplies にも鍵垢の返信は混ざらない", () => {
    const protectedIds = new Set(
      listUsers()
        .filter((user) => isProtected(user))
        .map((user) => user.id),
    );
    expect(protectedIds.size).toBeGreaterThan(0);
    for (const post of listPosts()) {
      for (const reply of listReplies(post.id)) {
        expect(protectedIds.has(reply.authorId)).toBe(false);
      }
    }
    // 公開アカウントの返信は従来どおり返る
    expect(listReplies("post-003").map((reply) => reply.id)).toContain("post-004");
  });

  it("listPostsByAuthor は件数表示のため鍵垢の投稿も含める", () => {
    const lockedUser = listUsers().find((user) => isProtected(user));
    const own = listPostsByAuthor(lockedUser?.id ?? "missing-author");
    // 公開面では除外される同じ投稿が、本人の件数には含まれる
    expect(own.length).toBeGreaterThan(0);
    for (const post of own) {
      expect(getPost(post.id)).toBeUndefined();
    }
  });
});

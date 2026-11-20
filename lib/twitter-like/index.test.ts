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
  searchPosts,
  searchUsers,
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
    // 鍵垢は複数ありうる（旧アカウント #94 も鍵垢）
    expect(protectedHandles).toContain("nagi");
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
    // 同じ公開投稿への返信では公開アカウントの返信だけが残り、鍵垢の返信は消える
    const repliesToPublicPost = listReplies("post-003").map((reply) => reply.id);
    expect(repliesToPublicPost).toContain("post-004");
    expect(repliesToPublicPost).not.toContain("post-026");
  });

  it("listPostsByAuthor は件数表示のため鍵垢の投稿も含める", () => {
    const lockedUser = listUsers().find((user) => isProtected(user));
    const own = listPostsByAuthor(lockedUser?.id ?? "missing-author");
    // 公開面では除外される同じ投稿が、本人の件数にはすべて含まれる
    expect(own.map((post) => post.id).sort()).toEqual(["post-024", "post-025", "post-026"]);
    for (const post of own) {
      expect(getPost(post.id)).toBeUndefined();
    }
  });
});

describe("searchPosts", () => {
  it("本文に語を含む投稿を新しい順で返す", () => {
    const posts = searchPosts("紅葉");
    expect(posts.map((post) => post.id)).toEqual(["post-017", "post-007", "post-001"]);
  });

  it("空白区切りの語をすべて含む投稿だけに絞る", () => {
    const posts = searchPosts("kohakunchos0117 待ってる");
    expect(posts.map((post) => post.id)).toEqual(["post-011"]);
  });

  it("先頭の # と @ は検索語から外す", () => {
    expect(searchPosts("#紅葉").map((post) => post.id)).toEqual(
      searchPosts("紅葉").map((post) => post.id),
    );
    expect(searchPosts("@kohakunchos0117").map((post) => post.id)).toEqual(
      searchPosts("kohakunchos0117").map((post) => post.id),
    );
  });

  it("大文字小文字は区別しない", () => {
    expect(searchPosts("KOHAKUNCHOS0117").map((post) => post.id)).toEqual(
      searchPosts("kohakunchos0117").map((post) => post.id),
    );
  });

  it("空のクエリでは何も返さない", () => {
    expect(searchPosts("")).toEqual([]);
    expect(searchPosts("   ")).toEqual([]);
  });

  it("投稿者の表示名・handleも検索対象にする", () => {
    // displayName「げーむ通信」とhandle「game-info」が別文字列の fixture で、
    // 片方の経路が壊れても検出できるようにそれぞれ独立に検証する
    expect(searchPosts("げーむ通信").map((post) => post.id)).toContain("post-001");
    expect(searchPosts("game-info").map((post) => post.id)).toContain("post-001");
    // 本文に handle を含まない tw-hal 本人の投稿も返る
    expect(searchPosts("kohakunchos0117").map((post) => post.id)).toContain("post-002");
  });

  it("鍵アカウントの投稿は検索結果に出さない", () => {
    // tw-nagi（鍵垢）の post-024〜026 の本文に一致する語で探しても出てこない
    expect(searchPosts("記録用")).toEqual([]);
    expect(searchPosts("混むのは苦手")).toEqual([]);
    expect(searchPosts("迷った").map((post) => post.id)).not.toContain("post-026");
  });
});

describe("searchUsers", () => {
  it("handle・displayName・bio を対象に検索する", () => {
    expect(searchUsers("kohakunchos0117").map((user) => user.id)).toEqual(["tw-hal"]);
    expect(searchUsers("げーむ通信").map((user) => user.id)).toEqual(["tw-gameinfo"]);
    const bioMatch = searchUsers("カフェ");
    expect(bioMatch.map((user) => user.id)).toEqual(["tw-sana"]);
  });

  it("空のクエリでは何も返さない", () => {
    expect(searchUsers("")).toEqual([]);
  });
});

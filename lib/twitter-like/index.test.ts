import { describe, expect, it } from "vitest";
import { searchPosts, searchUsers } from "./index";

describe("searchPosts", () => {
  it("本文に語を含む投稿を新しい順で返す", () => {
    const posts = searchPosts("紅葉");
    expect(posts.map((post) => post.id)).toEqual(["post-017", "post-007", "post-001"]);
  });

  it("空白区切りの語をすべて含む投稿だけに絞る", () => {
    const posts = searchPosts("hal 待ってる");
    expect(posts.map((post) => post.id)).toEqual(["post-011"]);
  });

  it("先頭の # と @ は検索語から外す", () => {
    expect(searchPosts("#紅葉").map((post) => post.id)).toEqual(
      searchPosts("紅葉").map((post) => post.id),
    );
    expect(searchPosts("@hal").map((post) => post.id)).toEqual(
      searchPosts("hal").map((post) => post.id),
    );
  });

  it("大文字小文字は区別しない", () => {
    expect(searchPosts("HAL").map((post) => post.id)).toEqual(
      searchPosts("hal").map((post) => post.id),
    );
  });

  it("空のクエリでは何も返さない", () => {
    expect(searchPosts("")).toEqual([]);
    expect(searchPosts("   ")).toEqual([]);
  });
});

describe("searchUsers", () => {
  it("handle・displayName・bio を対象に検索する", () => {
    expect(searchUsers("hal").map((user) => user.id)).toEqual(["tw-hal"]);
    expect(searchUsers("げーむ通信").map((user) => user.id)).toEqual(["tw-gameinfo"]);
    const bioMatch = searchUsers("カフェ");
    expect(bioMatch.map((user) => user.id)).toEqual(["tw-sana"]);
  });

  it("空のクエリでは何も返さない", () => {
    expect(searchUsers("")).toEqual([]);
  });
});

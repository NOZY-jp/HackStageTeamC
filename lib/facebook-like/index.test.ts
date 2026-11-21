import { describe, expect, it } from "vitest";
import {
  filterFeedPosts,
  getPostById,
  getSelfUser,
  getUserByHandle,
  listFeedPosts,
  listFriends,
  listPosts,
  listPostsByAuthor,
  listUsers,
  searchFacebook,
} from "./index";

describe("lib/facebook-like", () => {
  it("returns self user (u1)", () => {
    const self = getSelfUser();
    expect(self.id).toBe("u1");
    expect(self.handle).toBe("member01");
  });

  it("lists posts sorted newest first and deep-clones results", () => {
    const posts = listPosts();
    expect(posts.length).toBeGreaterThanOrEqual(5);
    expect(posts[0].createdAt >= posts[1].createdAt).toBe(true);

    posts[0].body = "mutated";
    expect(listPosts()[0].body).not.toBe("mutated");
  });

  it("keeps u40 posts out of the normal feed but keeps them searchable and on the profile", () => {
    const feed = listFeedPosts();
    expect(feed).toHaveLength(35);
    expect(feed.every((post) => post.authorId !== "u40")).toBe(true);
    expect(feed[0].createdAt >= feed[1].createdAt).toBe(true);

    // 検索とプロフィール用の全投稿には残す
    expect(listPosts().some((post) => post.authorId === "u40")).toBe(true);
    expect(listPostsByAuthor("u40")).toHaveLength(23);
    expect(searchFacebook("服部 由比").posts.every((post) => post.authorId === "u40")).toBe(true);

    // 呼び出し元の配列は変更しない
    const source = listPosts();
    const before = source.length;
    filterFeedPosts(source);
    expect(source).toHaveLength(before);
  });

  it("resolves user by handle and lists friends", () => {
    const user = getUserByHandle("member04");
    expect(user?.displayName).toBe("メンバー04");
    const friends = listFriends("u4");
    expect(friends.some((f) => f.id === "u1")).toBe(true);
  });

  it("finds post by id and filters posts by author", () => {
    const post = getPostById("fbp-101");
    expect(post?.authorId).toBe("u4");
    const authorPosts = listPostsByAuthor("u4");
    expect(authorPosts.some((p) => p.id === "fbp-101")).toBe(true);
  });

  it("searches users and posts case-insensitively", () => {
    const result = searchFacebook("Biome");
    expect(result.posts.some((p) => p.id === "fbp-105")).toBe(true);
    const botSearch = searchFacebook("notice-bot");
    expect(botSearch.users.some((u) => u.id === "u35")).toBe(true);
  });

  it("ensures every friendId references an existing user", () => {
    const users = listUsers();
    const ids = new Set(users.map((user) => user.id));
    for (const user of users) {
      for (const friendId of user.friendIds) {
        expect(
          ids.has(friendId),
          `${user.id} の friendIds が未定義の ${friendId} を参照しています`,
        ).toBe(true);
      }
    }
  });

  it("has exactly 58 posts with unique ids", () => {
    const posts = listPosts();
    expect(posts.length).toBe(58);

    const ids = new Set(posts.map((post) => post.id));
    expect(ids.size).toBe(posts.length);
  });

  it("ensures every post authorId references an existing user", () => {
    const userIds = new Set(listUsers().map((user) => user.id));
    for (const post of listPosts()) {
      expect(
        userIds.has(post.authorId),
        `投稿 ${post.id} の authorId ${post.authorId} が未定義です`,
      ).toBe(true);
    }
  });

  it("ensures every comment matches its parent post and existing author", () => {
    const userIds = new Set(listUsers().map((user) => user.id));
    for (const post of listPosts()) {
      for (const comment of post.comments) {
        expect(
          comment.postId,
          `コメント ${comment.id} の postId が投稿 ${post.id} と一致しません`,
        ).toBe(post.id);
        expect(
          userIds.has(comment.authorId),
          `コメント ${comment.id} の authorId ${comment.authorId} が未定義です`,
        ).toBe(true);
      }
    }
  });

  it("formats createdAt as ISO-8601 UTC seconds", () => {
    const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    for (const post of listPosts()) {
      expect(post.createdAt, `投稿 ${post.id} の createdAt が不正です`).toMatch(pattern);
      for (const comment of post.comments) {
        expect(comment.createdAt, `コメント ${comment.id} の createdAt が不正です`).toMatch(
          pattern,
        );
      }
    }
  });

  it("keeps spoiler words out of new posts (fbp-3xx / fbp-4xx)", () => {
    const spoilers = ["服部", "小路", "花音", "でんちゃん", "蒼穹", "海斗"];
    const newPosts = listPosts().filter((post) => /^fbp-[34]\d\d$/.test(post.id));
    expect(newPosts.length).toBe(50);
    for (const post of newPosts) {
      for (const text of [post.body, ...post.comments.map((c) => c.body)]) {
        for (const spoiler of spoilers) {
          expect(
            text.includes(spoiler),
            `投稿 ${post.id} に答え語「${spoiler}」が含まれています`,
          ).toBe(false);
        }
      }
    }
  });

  it("lists 23 posts for author u40", () => {
    const posts = listPostsByAuthor("u40");
    expect(posts.length).toBe(23);
  });
});

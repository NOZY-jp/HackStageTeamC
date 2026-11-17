import { describe, expect, it } from "vitest";
import {
  getPostById,
  getSelfUser,
  getUserByHandle,
  listFriends,
  listPosts,
  listPostsByAuthor,
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
});

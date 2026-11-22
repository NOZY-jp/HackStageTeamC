import { describe, expect, it } from "vitest";
import { twitterFollows, twitterPosts, twitterUsers } from "./data/twitter";
import { getPost, listFollowingIds, listHomePosts, listRecommendedPosts } from "./index";

/**
 * #212: Twixer のタイムライン。「おすすめ」と「フォロー中」を別の配列にし、
 * フォロー外の投稿もおすすめに出す（かのん・旧アカウントは順序のため出さない）。
 */

const RECOMMENDED = listRecommendedPosts("tw-hal");
const FOLLOWING = listHomePosts("tw-hal");
const ids = (posts: { id: string }[]) => posts.map((post) => post.id);

describe("Twixer のタイムライン（#212）", () => {
  it("アカウントと投稿が増え、MaiMai は20件以上", () => {
    expect(twitterUsers.length).toBeGreaterThanOrEqual(200);
    expect(twitterPosts.length).toBeGreaterThanOrEqual(2000);
    expect(twitterPosts.filter((post) => post.authorId === "tw-mai").length).toBeGreaterThanOrEqual(
      20,
    );
  });

  it("「おすすめ」と「フォロー中」は別の配列", () => {
    expect(ids(RECOMMENDED)).not.toEqual(ids(FOLLOWING));
    expect(new Set(RECOMMENDED.map((post) => post.authorId)).size).toBeGreaterThanOrEqual(8);
    expect(ids(FOLLOWING).length).toBeGreaterThan(0);
  });

  it("「フォロー中」はフォロー相手と自分だけ", () => {
    const allowed = new Set(["tw-hal", ...listFollowingIds("tw-hal")]);
    for (const post of FOLLOWING) {
      expect(allowed.has(post.authorId), post.id).toBe(true);
    }
  });

  it("「おすすめ」にフォロー外が出る（フォローは変えない）", () => {
    const follows = new Set(["tw-hal", ...listFollowingIds("tw-hal")]);
    expect(RECOMMENDED.some((post) => !follows.has(post.authorId))).toBe(true);
    expect(twitterFollows["tw-hal"]).toEqual(["tw-mai", "tw-sou"]);
  });

  it("UTC の生成投稿と JST の既存投稿を実時刻順に並べる", () => {
    const posts = ids(RECOMMENDED);
    expect(posts).toContain("post-g1874");
    expect(posts).toContain("post-400");
    expect(posts.indexOf("post-g1874")).toBeLessThan(posts.indexOf("post-400"));
  });

  it("かのんと旧アカウントは「おすすめ」にも出さない", () => {
    const hidden = new Set(["tw-kanon", "tw-old-denden"]);
    for (const post of RECOMMENDED) {
      expect(hidden.has(post.authorId), post.id).toBe(false);
    }
  });

  it("post-101・post-102 は不変", () => {
    expect(getPost("post-101")).toEqual({
      id: "post-101",
      authorId: "tw-mai",
      postedAt: "2019-09-08T22:10:00+09:00",
      body: "弓の属性装備、スキル枠がかつかつでどれ削るか悩む…",
      replyCount: 1,
      repostCount: 0,
      likeCount: 12,
    });
    expect(getPost("post-102")).toEqual({
      id: "post-102",
      authorId: "tw-tomo",
      postedAt: "2019-09-09T21:40:00+09:00",
      body: "この立ち回り、まいまいが前のブログで書いてた弓属性強化ガン積み構成のやつより楽じゃない？",
      replyToId: "post-101",
      replyCount: 0,
      repostCount: 0,
      likeCount: 3,
    });
  });
});

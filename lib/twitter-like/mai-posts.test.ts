import { describe, expect, it } from "vitest";
import { twitterPosts } from "./data/twitter";
import { listHomePosts, listRecommendedPosts } from "./index";

/**
 * #241: Mai の投稿を増やし、12か月以上に分散させる。
 * post-101/102/105 は不変、かのん・旧垢はおすすめに出さない。
 */

const mai = twitterPosts.filter((post) => post.authorId === "tw-mai");
const topLevel = mai.filter((post) => !post.replyToId);
const bodies = mai.map((post) => post.body.replace(/\s+/g, ""));

describe("Mai の投稿（#241）", () => {
  it("投稿60件以上（トップレベル50件以上）", () => {
    expect(mai.length).toBeGreaterThanOrEqual(60);
    expect(topLevel.length).toBeGreaterThanOrEqual(50);
  });

  it("12か月以上に分散し、同じ月に10件を超えない", () => {
    const months = new Map<string, number>();
    for (const post of mai) {
      const month = post.postedAt.slice(0, 7);
      months.set(month, (months.get(month) ?? 0) + 1);
    }
    expect(months.size).toBeGreaterThanOrEqual(12);
    expect(Math.max(...months.values())).toBeLessThanOrEqual(10);
  });

  it("ホーム（おすすめ）に Mai が30件以上出る", () => {
    const recommended = listRecommendedPosts("tw-hal").filter(
      (post) => post.authorId === "tw-mai" && !post.replyToId,
    );
    expect(recommended.length).toBeGreaterThanOrEqual(30);
    expect(listHomePosts("tw-hal").some((post) => post.authorId === "tw-mai")).toBe(true);
  });

  it("同じ本文がない（8文字以上）", () => {
    const long = bodies.filter((body) => [...body].length >= 8);
    expect(new Set(long).size).toBe(long.length);
  });

  it("かのん・旧アカウントはおすすめに出さない", () => {
    const hidden = new Set(["tw-kanon", "tw-old-denden"]);
    for (const post of listRecommendedPosts("tw-hal")) {
      expect(hidden.has(post.authorId), post.id).toBe(false);
    }
  });
});

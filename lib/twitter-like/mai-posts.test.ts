import { describe, expect, it } from "vitest";
import { twitterPosts } from "./data/twitter";
import { listHomePosts, listRecommendedPosts } from "./index";

/**
 * #241: Mai の投稿を増やし、12か月以上に分散させる。
 * post-101/102/105 は不変、かのん・旧垢はおすすめに出さない。
 */

const topLevel = twitterPosts.filter((post) => post.authorId === "tw-mai" && !post.replyToId);
const mai = topLevel;
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

  it("失踪後（11/19 21:47）に投稿せず、最後のトップレベルは post-019（11/15）", () => {
    const latest = [...mai].sort((a, b) => b.postedAt.localeCompare(a.postedAt))[0];
    expect(latest.id).toBe("post-019");
    expect(latest.postedAt).toBe("2026-11-15T23:12:00+09:00");
    expect(mai.some((post) => post.postedAt >= "2026-11-19T21:47:00+09:00")).toBe(false);
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

describe("Mai の季節表現（#272）", () => {
  // 8月下旬に移した投稿の本文が秋冬のままだと、直前の post-621（残暑）と食い違う。
  const AUTUMN_WINTER = [
    "秋",
    "冬",
    "寒",
    "こたつ",
    "コート",
    "紅葉",
    "雪",
    "暖房",
    "ストーブ",
    "マフラー",
    "手袋",
    "スープ",
  ];

  it("8月の投稿に秋冬の語を出さない", () => {
    const august = mai.filter((post) => post.postedAt.slice(0, 7) === "2026-08");
    expect(august.length).toBeGreaterThan(0);
    for (const post of august) {
      const hits = AUTUMN_WINTER.filter((word) => post.body.includes(word));
      expect(hits, `${post.id} ${post.body}`).toEqual([]);
    }
  });

  it("8月下旬へ移した3件は日付を変えず、本文だけ残暑に合わせる", () => {
    const byId = new Map(mai.map((post) => [post.id, post]));
    expect(byId.get("post-650")?.postedAt).toBe("2026-08-30T21:05:00+09:00");
    expect(byId.get("post-651")?.postedAt).toBe("2026-08-29T20:40:00+09:00");
    expect(byId.get("post-652")?.postedAt).toBe("2026-08-20T19:25:00+09:00");
    for (const id of ["post-650", "post-651", "post-652"]) {
      const post = byId.get(id);
      expect(post, id).toBeDefined();
      expect(post?.body.length ?? 0).toBeGreaterThan(15);
    }
  });
});

import { describe, expect, it } from "vitest";
import { searchPosts, searchUsers } from ".";

describe("Twixer の検索候補（#248）", () => {
  it.each(["モンハン", "ブログ", "弓", "写真コンテスト", "ストーカー", "でんでん"])(
    "%s には10人以上の公開候補があり、旧アカウントは上位3人に出ない",
    (query) => {
      const matches = searchUsers(query);
      expect(matches.filter((user) => !user.protected).length).toBeGreaterThanOrEqual(10);
      expect(matches.slice(0, 3).map((user) => user.handle)).not.toContain("maimai_mhw");
    },
  );

  it("ブログ記事名に一致する公開 bio から鍵付きの旧アカウントをたどれる", () => {
    expect(searchUsers("写真コンテストで賞をもらいました！").map((user) => user.handle)).toContain(
      "maimai_mhw",
    );
    expect(searchPosts("モンスターハンターワールド、はじめた。武器は双剣にした。")).toEqual([]);
  });

  it.each(["ストーカー", "かのん", "@kanon__dayo"])(
    "「%s」では発見後にだけアカウントと post-105 を検索結果に出す",
    (query) => {
      const found = { foundBff: true };
      expect(searchUsers(query).map((user) => user.id)).not.toContain("tw-kanon");
      expect(searchPosts(query).map((post) => post.id)).not.toContain("post-105");
      expect(searchUsers(query, found).map((user) => user.id)).toContain("tw-kanon");
      expect(searchPosts(query, found).map((post) => post.id)).toContain("post-105");
    },
  );

  it("本文だけの語から公開アカウントを見つけ、鍵付き投稿だけの語では拾わない", () => {
    const visible = searchPosts("写真コンテスト").find((post) =>
      post.authorId.startsWith("tw-gen-"),
    );
    expect(visible).toBeDefined();
    const results = searchUsers("写真コンテスト");
    expect(results.map((user) => user.id)).toContain(visible?.authorId);
    expect(searchUsers("ブログもはじめてみた").map((user) => user.id)).not.toContain(
      "tw-old-denden",
    );
  });
});

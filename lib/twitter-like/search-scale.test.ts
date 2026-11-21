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

  it("発見前はかのんのアカウントと投稿を検索に出さず、発見後に出す", () => {
    expect(searchUsers("kanon__dayo").map((user) => user.id)).not.toContain("tw-kanon");
    expect(searchPosts("ストーカー").map((post) => post.id)).not.toContain("post-105");
    expect(searchUsers("kanon__dayo", { foundBff: true }).map((user) => user.id)).toContain(
      "tw-kanon",
    );
    expect(searchPosts("ストーカー", { foundBff: true }).map((post) => post.id)).toContain(
      "post-105",
    );
  });
});

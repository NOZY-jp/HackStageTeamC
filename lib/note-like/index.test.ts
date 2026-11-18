import { describe, expect, it } from "vitest";
import {
  formatPublishedAt,
  getArticle,
  getCreator,
  listArticles,
  listArticlesByCreator,
  listCreators,
  matchesQuery,
  searchArticles,
} from "./index";
import type { Article, Creator } from "./types";

const creator: Creator = {
  id: "writer_a",
  displayName: "書き手A",
  bio: "テスト用",
  avatarColor: "#000000",
};

const article: Article = {
  id: "n-1",
  creatorId: "writer_a",
  title: "駅前の Coffee",
  excerpt: "待ち合わせの前に寄った店。",
  publishedAt: "2026-11-18T23:40:00+09:00",
  tags: ["日記"],
  likeCount: 3,
  body: [
    { kind: "heading", text: "深煎り" },
    { kind: "paragraph", text: "窓際の席に座った。" },
    { kind: "divider" },
  ],
};

describe("lib/note-like のアクセサ", () => {
  it("listArticles は publishedAt 降順で返す", () => {
    const times = listArticles().map((item) => item.publishedAt);
    expect(times).toEqual([...times].sort().reverse());
  });

  it("書き手ごとの記事は、その書き手のものだけを返す", () => {
    for (const item of listCreators()) {
      for (const found of listArticlesByCreator(item.id)) {
        expect(found.creatorId).toBe(item.id);
      }
    }
  });

  it("存在しないIDでは undefined / 空配列を返す", () => {
    expect(getCreator("missing-creator")).toBeUndefined();
    expect(getArticle("missing-creator", "missing-article")).toBeUndefined();
    expect(listArticlesByCreator("missing-creator")).toEqual([]);
  });

  it("戻り値を書き換えても内部状態が変わらない（深いコピー）", () => {
    const [first] = listCreators();
    expect(first).toBeDefined();
    const before = first.displayName;
    first.displayName = "書き換え";
    expect(getCreator(first.id)?.displayName).toBe(before);
  });
});

describe("matchesQuery / searchArticles", () => {
  it("タイトル・本文・タグ・書き手の名前とIDに一致する", () => {
    expect(matchesQuery(article, creator, "駅前")).toBe(true);
    expect(matchesQuery(article, creator, "窓際")).toBe(true);
    expect(matchesQuery(article, creator, "日記")).toBe(true);
    expect(matchesQuery(article, creator, "書き手A")).toBe(true);
    expect(matchesQuery(article, creator, "writer_a")).toBe(true);
  });

  it("大文字小文字と先頭の # を無視する", () => {
    expect(matchesQuery(article, creator, "coffee")).toBe(true);
    expect(matchesQuery(article, creator, "#日記")).toBe(true);
  });

  it("空白区切りの語は、すべて含むときだけ一致する", () => {
    expect(matchesQuery(article, creator, "駅前 深煎り")).toBe(true);
    expect(matchesQuery(article, creator, "駅前　窓際")).toBe(true);
    expect(matchesQuery(article, creator, "駅前 紅茶")).toBe(false);
  });

  it("空の検索語は何にも一致しない", () => {
    expect(matchesQuery(article, creator, "   ")).toBe(false);
    expect(searchArticles("")).toEqual([]);
  });
});

describe("formatPublishedAt", () => {
  it("日本時間の固定文字列をそのまま整形する", () => {
    expect(formatPublishedAt("2026-11-18T23:40:00+09:00")).toBe("2026年11月18日 23:40");
    expect(formatPublishedAt("2026-06-02T01:05:00+09:00", "date")).toBe("2026年6月2日");
  });

  it("形式が違う文字列はそのまま返す", () => {
    expect(formatPublishedAt("きのう")).toBe("きのう");
  });
});

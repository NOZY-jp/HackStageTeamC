import { describe, expect, it } from "vitest";
import { LEAF_CREATOR_ID } from "@/lib/blog-migration/articles";
import {
  formatPublishedAt,
  getArticle,
  getCreator,
  listArticles,
  listArticlesByCreator,
  listCreators,
  listTopArticles,
  matchesQuery,
  orderTopArticles,
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

  it("listTopArticles は MaiMai を含まず、同じ書き手が3件以上連続しない", () => {
    const top = listTopArticles();
    expect(top.length).toBeGreaterThanOrEqual(30);
    expect(top.some((item) => item.creatorId === LEAF_CREATOR_ID)).toBe(false);

    for (let i = 2; i < top.length; i += 1) {
      const sameThree =
        top[i].creatorId === top[i - 1].creatorId && top[i].creatorId === top[i - 2].creatorId;
      expect(sameThree, `${top[i].id} で ${top[i].creatorId} が3連続`).toBe(false);
    }

    const originalTitle = top[0].title;
    top[0].title = "改変";
    expect(listTopArticles()[0].title).toBe(originalTitle);
  });

  it("orderTopArticles は偏った新着順でも同じ書き手の3連続を防ぐ", () => {
    const makeArticle = (id: string, creatorId: string, day: number): Article => ({
      ...article,
      id,
      creatorId,
      publishedAt: `2026-10-${String(day).padStart(2, "0")}T12:00:00+09:00`,
    });
    const sorted = [
      makeArticle("a5", "creator_a", 21),
      makeArticle("a4", "creator_a", 20),
      makeArticle("a3", "creator_a", 19),
      makeArticle("b1", "creator_b", 18),
      makeArticle("a2", "creator_a", 17),
      makeArticle("a1", "creator_a", 16),
      makeArticle("b2", "creator_b", 15),
    ];
    const ordered = orderTopArticles(sorted);
    expect(ordered).toHaveLength(sorted.length);
    for (let i = 2; i < ordered.length; i += 1) {
      expect(
        ordered[i].creatorId === ordered[i - 1].creatorId &&
          ordered[i].creatorId === ordered[i - 2].creatorId,
      ).toBe(false);
    }
  });
});

describe("matchesQuery / searchArticles", () => {
  it("タイトル・本文・タグ・書き手の名前/自己紹介/IDに一致する", () => {
    expect(matchesQuery(article, creator, "駅前")).toBe(true);
    expect(matchesQuery(article, creator, "窓際")).toBe(true);
    expect(matchesQuery(article, creator, "日記")).toBe(true);
    expect(matchesQuery(article, creator, "書き手A")).toBe(true);
    expect(matchesQuery(article, creator, "テスト用")).toBe(true);
    expect(matchesQuery(article, creator, "writer_a")).toBe(true);
  });

  it("「でんでん」「MaiMai」でスクショ記事が見つかり、弓構成の記事は見つからない", () => {
    expect(searchArticles("でんでん").map((item) => item.id)).toContain(
      "maimai-2020-02-screenshot",
    );
    expect(searchArticles("MaiMai").map((item) => item.id)).toContain("maimai-2020-02-screenshot");
    expect(searchArticles("弓属性強化ガン積み構成").map((item) => item.id)).not.toContain(
      "maimai-2019-08-bow-build",
    );
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

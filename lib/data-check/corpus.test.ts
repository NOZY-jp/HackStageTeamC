import { describe, expect, it } from "vitest";
import { collectCorpus, itemsOf } from "./corpus";
import { checkAll, forbiddenWords, realNames, storyOnlyPhrases } from "./rules";

describe("検査対象データの収集", () => {
  it("ハッシュタグや見出しを検査し、色コードや URL を除く", () => {
    const items = itemsOf("twixer", "posts", [
      {
        id: "post-1",
        tags: ["#ゆっちゃん"],
        headings: ["# 住所を特定しました", "# 服部"],
        color: "#5865f2",
        url: "https://example.com/",
      },
    ]);

    expect(items[0].texts).toEqual(["post-1", "#ゆっちゃん", "# 住所を特定しました", "# 服部"]);
    expect(forbiddenWords(items)).toHaveLength(1);
    expect(realNames(items)).toHaveLength(1);
    expect(storyOnlyPhrases(items)).toHaveLength(1);
  });

  it("本文だけにある検索対象プロフィールへの直接パスを検出する", () => {
    const posts = itemsOf("talkup", "posts", [
      { id: "relative", body: "/talkup/profile/yui__photo" },
      { id: "absolute", body: "https://example.com/talkup/profile/yui__photo?from=post" },
      { id: "public", body: "/talkup/profile/member01" },
      { id: "different", body: "/talkup/profile/yui__photo_extra" },
    ]);

    expect(posts[2].texts).toContain("/talkup/profile/member01");
    expect(
      checkAll(posts)
        .filter(({ rule }) => rule === "direct-profile-link")
        .map(({ ref }) => ref),
    ).toEqual(["talkup/posts/relative", "talkup/posts/absolute"]);
  });

  it("日付に似た名前の本文フィールドを日時として扱わない", () => {
    const [item] = itemsOf("twixer", "posts", [
      {
        update: "更新内容",
        candidate: "候補",
        date: "2026-11-20",
        sentAt: "invalid",
      },
    ]);

    expect(item.texts).toEqual(["更新内容", "候補"]);
    expect(item.times).toEqual([
      { key: "date", value: "2026-11-20" },
      { key: "sentAt", value: "invalid" },
    ]);
  });

  it("本名を含むコンテスト結果と検索対象プロフィールを収集する", () => {
    const corpus = collectCorpus();
    const contest = corpus.find(({ dataset }) => dataset === "contestResults");
    const profile = corpus.find(
      ({ platform, dataset, id }) => platform === "talkup" && dataset === "users" && id === "u40",
    );
    expect(contest?.texts).toContain("服部 由比");
    expect(profile?.texts).toContain("服部 由比");
    expect(realNames(corpus)).toEqual([]);
  });

  it("サーバー、DM スレッド、通話、画像、トレンドを収集する", () => {
    const datasets = new Set(
      collectCorpus().map(({ platform, dataset }) => `${platform}/${dataset}`),
    );
    for (const dataset of [
      "discord/guilds",
      "discord/dmThreads",
      "discord/voiceStates",
      "discord/voiceSessions",
      "discord/messageImages",
      "twixer/trends",
    ]) {
      expect(datasets.has(dataset), dataset).toBe(true);
    }
  });
});

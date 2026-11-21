import { describe, expect, it } from "vitest";
import { extractLinkCandidates } from "./candidates";
import { normalizeAppPath, resolveLinkEmbeds } from "./index";

const POST_101_URL = "https://twixer.com/mai2mai2/status/post-101";

describe("extractLinkCandidates", () => {
  it("http(s) のURLとアプリ内パスを拾う", () => {
    expect(extractLinkCandidates(`見て ${POST_101_URL} これ`)).toEqual([POST_101_URL]);
    expect(extractLinkCandidates("ここ /twitter/post/post-101 だよ")).toEqual([
      "/twitter/post/post-101",
    ]);
  });

  it("URLの後ろの句読点・括弧は含めない", () => {
    expect(extractLinkCandidates(`これ（${POST_101_URL}）。`)).toEqual([POST_101_URL]);
  });

  it("URL が無い本文からは拾わない", () => {
    expect(extractLinkCandidates("URL はないよ")).toEqual([]);
  });
});

describe("normalizeAppPath（作中ドメイン→アプリ内パス）", () => {
  it.each([
    [POST_101_URL, "/twitter/post/post-101"],
    ["twixer.com/mai2mai2/status/post-101", "/twitter/post/post-101"],
    ["https://twixer.com/mai2mai2", "/twitter/profile/mai2mai2"],
    [
      "https://leaf.jp/maimai/n/maimai-2020-02-screenshot",
      "/note/maimai/n/maimai-2020-02-screenshot",
    ],
    ["https://pochiblo.jp/denden0102", "/pochiblo/denden0102"],
    [
      "https://discord.com/channels/@me/1187002356428841502",
      "/discord.com/channels/@me/1187002356428841502",
    ],
    ["/twitter/post/post-101", "/twitter/post/post-101"],
  ])("%s → %s", (candidate, expected) => {
    expect(normalizeAppPath(candidate)).toBe(expected);
  });
});

describe("resolveLinkEmbeds", () => {
  it("Twixer の投稿URLは、実データから作ったカードになる", () => {
    const embeds = resolveLinkEmbeds(`これ見て ${POST_101_URL}`);
    expect(embeds).toHaveLength(1);
    const embed = embeds[0];
    expect(embed.href).toBe("/twitter/post/post-101");
    expect(embed.siteName).toBe("Twixer");
    expect(embed.title).toBe("Mai（@mai2mai2）");
    expect(embed.description).toContain("双剣");
  });

  it("アプリ内パスで貼っても同じカードになる", () => {
    const embeds = resolveLinkEmbeds("これ /twitter/post/post-101");
    expect(embeds[0]?.href).toBe("/twitter/post/post-101");
  });

  it("マイリスト・記事・leaf 記事のリンクもカードになる", () => {
    const mylist = resolveLinkEmbeds("/pochiblo/mylist/k7q2m9d4");
    expect(mylist[0]).toMatchObject({ siteName: "ぽちブロ", href: "/pochiblo/mylist/k7q2m9d4" });

    const entry = resolveLinkEmbeds("/pochiblo/denden0102/entry/e20181117");
    expect(entry[0]).toMatchObject({
      siteName: "ぽちブロ",
      title: "写真コンテストで賞をもらいました！",
    });

    const article = resolveLinkEmbeds("/note/maimai/n/maimai-2020-02-screenshot");
    expect(article[0]).toMatchObject({
      siteName: "leaf",
      title: "昔のブログから、ゲーム画面を移しました",
    });
  });

  it("Discord のチャンネルリンクはサーバー名とチャンネル名のカードになる", () => {
    const embeds = resolveLinkEmbeds("https://discord.com/channels/@me/1187002356428841502");
    expect(embeds[0]).toMatchObject({ siteName: "Discord" });
    expect(embeds[0]?.title).toContain("DM");
  });

  it("外部のURL・存在しないページはカードにしない（本文のまま）", () => {
    expect(resolveLinkEmbeds("https://example.com/mhc/gear-notes")).toEqual([]);
    expect(resolveLinkEmbeds("/twitter/post/no-such-post")).toEqual([]);
    expect(resolveLinkEmbeds("twixer.com/mai2mai2/status/no-such")).toEqual([]);
  });

  it("同じリンク先は1件だけ。複数あれば本文の順で出す", () => {
    const body = `${POST_101_URL} と ${POST_101_URL} と /twitter/post/post-102`;
    const embeds = resolveLinkEmbeds(body);
    expect(embeds.map((embed) => embed.href)).toEqual([
      "/twitter/post/post-101",
      "/twitter/post/post-102",
    ]);
  });
});

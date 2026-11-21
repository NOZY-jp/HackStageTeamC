import { describe, expect, it } from "vitest";
import { extractLinkCandidates } from "../blog-like/url";
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

  it("大文字スキーム＋ポートのURLも丸ごと1トークンで取る（パスだけを拾わない）", () => {
    expect(extractLinkCandidates("罠 HTTPS://evil.example:443/twitter/post/post-101 だよ")).toEqual(
      ["HTTPS://evil.example:443/twitter/post/post-101"],
    );
  });

  it("ftp: など別スキームのURLも丸ごと1トークンで取る（パスだけを拾わない）", () => {
    expect(extractLinkCandidates("罠 ftp://twixer.com/mai2mai2/status/post-101 だよ")).toEqual([
      "ftp://twixer.com/mai2mai2/status/post-101",
    ]);
  });

  it("@ を含むアプリ内パスも切れずに拾う（/channels/@me/...）", () => {
    expect(
      extractLinkCandidates("ここ /discord.com/channels/@me/1187002356428841501 だよ"),
    ).toEqual(["/discord.com/channels/@me/1187002356428841501"]);
  });

  it(":// を持たないスキームの尻尾はパスとして拾わない（data:, javascript:, mailto:）", () => {
    // 以前は data:...,/path の /path 部分だけがアプリ内パスとして拾われてカードになっていた
    expect(extractLinkCandidates("data:text/plain,/twitter/post/post-101")).toEqual([]);
    expect(extractLinkCandidates("javascript:/twitter/post/post-101")).toEqual([]);
    expect(extractLinkCandidates("javascript:alert(/twitter/post/post-101)")).toEqual([]);
    expect(extractLinkCandidates("mailto:a@example.com/twitter/post/post-101")).toEqual([]);
  });

  it("別トークンの中の /... は拾わない（単語の中のスラッシュ・途中のカンマ）", () => {
    expect(extractLinkCandidates("and/or")).toEqual([]);
    expect(extractLinkCandidates("foo/twitter/post/post-101")).toEqual([]);
    expect(extractLinkCandidates("x,y/twitter/post/post-101")).toEqual([]);
  });

  it("行頭・空白・括弧類の直後の / パスは従来どおり拾う", () => {
    expect(extractLinkCandidates("/twitter/post/post-101")).toEqual(["/twitter/post/post-101"]);
    expect(extractLinkCandidates("（/twitter/post/post-101）")).toEqual(["/twitter/post/post-101"]);
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

  it("外部サイトのURLはパスを見ない（同一オリジンだけ拾う）", () => {
    // アプリ内ルートと同じパスでも、外部ホストなら undefined
    expect(normalizeAppPath("https://example.com/twitter/post/post-101")).toBeUndefined();
    // このアプリ自身のURLをそのまま貼った場合だけパスを見る
    expect(normalizeAppPath("https://app.local/twitter/post/post-101", "app.local")).toBe(
      "/twitter/post/post-101",
    );
    expect(
      normalizeAppPath("https://app.local:3000/twitter/post/post-101", "app.local"),
    ).toBeUndefined();
  });

  it("http(s) 以外のスキームは受理しない（作中ドメイン・同一オリジンでも）", () => {
    expect(normalizeAppPath("ftp://twixer.com/mai2mai2/status/post-101")).toBeUndefined();
    expect(normalizeAppPath("ftp://pochiblo.jp/denden0102")).toBeUndefined();
    // 同一オリジンでも ftp は受理しない（裸のホスト名比較でもスキームを弾く）
    expect(normalizeAppPath("ftp://app.local/twitter/post/post-101", "app.local")).toBeUndefined();
    // 大文字の http(s) は従来どおり受理する
    expect(normalizeAppPath("HTTPS://twixer.com/mai2mai2/status/post-101")).toBe(
      "/twitter/post/post-101",
    );
  });

  it("オリジンを渡すとスキーム込みで比べる（http と https は別オリジン）", () => {
    // location.origin を渡した場合、ホスト・ポートが同じでもスキームが違えばカードにしない
    expect(
      normalizeAppPath("https://app.local:3000/twitter/post/post-101", "http://app.local:3000"),
    ).toBeUndefined();
    expect(
      normalizeAppPath("http://app.local:3000/twitter/post/post-101", "http://app.local:3000"),
    ).toBe("/twitter/post/post-101");
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
    expect(embed.description).toContain("弓の属性装備");
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

    const channel = resolveLinkEmbeds(
      "https://discord.com/channels/1187002356428840961/1187002356428840963",
    );
    expect(channel[0]).toMatchObject({ siteName: "モンハンコミュニティ", title: "#雑談" });
  });

  it("別サーバーのチャンネルIDを組み合わせたリンクはカードにしない（ページ側と同じ解決）", () => {
    // 大学サーバーのURLに、モンハンコミュニティのチャンネルIDを載せた不整合なリンク
    expect(
      resolveLinkEmbeds("https://discord.com/channels/1187002356428840981/1187002356428840963"),
    ).toEqual([]);
    // 逆方向（存在するサーバー＋別サーバーのチャンネル）も同じ
    expect(
      resolveLinkEmbeds("/discord.com/channels/1187002356428840961/1187002356428840982"),
    ).toEqual([]);
  });

  it("外部のURL・存在しないページはカードにしない（本文のまま）", () => {
    expect(resolveLinkEmbeds("https://example.com/mhc/gear-notes")).toEqual([]);
    // アプリ内ルートと同じパスを持つ外部URLもカードにしない
    expect(resolveLinkEmbeds("https://example.com/twitter/post/post-101")).toEqual([]);
    expect(resolveLinkEmbeds("/twitter/post/no-such-post")).toEqual([]);
    expect(resolveLinkEmbeds("twixer.com/mai2mai2/status/no-such")).toEqual([]);
  });

  it("同一オリジンのURLはカードになる（デプロイ先のURLをそのまま貼った場合）", () => {
    const embeds = resolveLinkEmbeds(
      "https://hack-stage-team-c.vercel.app/twitter/post/post-101",
      "hack-stage-team-c.vercel.app",
    );
    expect(embeds[0]?.href).toBe("/twitter/post/post-101");
  });

  it("同じリンク先は1件だけ。複数あれば本文の順で出す", () => {
    const body = `${POST_101_URL} と ${POST_101_URL} と /twitter/post/post-102`;
    const embeds = resolveLinkEmbeds(body);
    expect(embeds.map((embed) => embed.href)).toEqual([
      "/twitter/post/post-101",
      "/twitter/post/post-102",
    ]);
  });

  it("相対パスの Discord DM リンクもカードになる（/discord.com/channels/@me/...）", () => {
    const embeds = resolveLinkEmbeds("/discord.com/channels/@me/1187002356428841501");
    expect(embeds[0]).toMatchObject({ siteName: "Discord" });
    expect(embeds[0]?.title).toContain("DM");
    expect(embeds[0]?.href).toBe("/discord.com/channels/@me/1187002356428841501");
  });

  it("壊れたURLが混ざっていても、他のURLのカードは出す（候補ごとに失敗を切り分ける）", () => {
    // "%zz" は decodeURIComponent が例外を投げる壊れたパーセントエンコード。
    // これが原因でメッセージ全体のカードが消えないことを確かめる
    const embeds = resolveLinkEmbeds(
      `壊れた https://discord.com/channels/%zz/1187002356428841502 と ${POST_101_URL}`,
    );
    expect(embeds.map((embed) => embed.href)).toEqual(["/twitter/post/post-101"]);
    // 壊れたURLだけならカードは出ない（例外は投げない）
    expect(resolveLinkEmbeds("https://discord.com/channels/%zz/1187002356428841502")).toEqual([]);
  });

  it("大文字スキーム＋ポートの外部URLは、パスがアプリ内ルートでもカードにしない", () => {
    // 以前は HTTPS:// をURLとして拾えず、ホスト部のあとの /twitter/... だけが
    // アプリ内パスとして解決されてカードになっていた
    expect(resolveLinkEmbeds("これ見て HTTPS://evil.example:443/twitter/post/post-101")).toEqual(
      [],
    );
  });

  it("Twixer の投稿URLに余分なパスを足したURLはカードにしない", () => {
    // 実在する投稿URL + /nonexistent は別ページなので、その投稿のカードにしない
    expect(resolveLinkEmbeds("https://twixer.com/mai2mai2/status/post-101/nonexistent")).toEqual(
      [],
    );
    // status の形が壊れたURLは、プロフィールにもフォールバックしない
    expect(resolveLinkEmbeds("https://twixer.com/mai2mai2/status")).toEqual([]);
  });

  it("http(s) 以外のスキームのURLはカードにしない", () => {
    // ftp: でもホストが作中ドメインなら以前はカードになっていた
    expect(resolveLinkEmbeds("ftp://twixer.com/mai2mai2/status/post-101")).toEqual([]);
    expect(resolveLinkEmbeds("file:///twitter/post/post-101")).toEqual([]);
    expect(resolveLinkEmbeds("ftp://discord.com/channels/@me/1187002356428841501")).toEqual([]);
    // 別スキームURLのあとに書いた有効なURLのカードは出る（候補ごとに切り分ける）
    const embeds = resolveLinkEmbeds(
      `罠 ftp://twixer.com/mai2mai2/status/post-101 と ${POST_101_URL}`,
    );
    expect(embeds.map((embed) => embed.href)).toEqual(["/twitter/post/post-101"]);
  });

  it(":// を持たないスキーム・相対文字列はカードにしない（投稿もプロフィールも）", () => {
    // data: URL の尻尾が投稿とプロフィール両方のカードになっていた問題の回帰
    expect(
      resolveLinkEmbeds("data:text/plain,/twitter/post/post-101,/twitter/profile/mai2mai2"),
    ).toEqual([]);
    expect(resolveLinkEmbeds("javascript:/twitter/post/post-101")).toEqual([]);
    expect(resolveLinkEmbeds("mailto:a@example.com/twitter/profile/mai2mai2")).toEqual([]);
    expect(resolveLinkEmbeds("and/or")).toEqual([]);
    expect(resolveLinkEmbeds("foo/twitter/post/post-101")).toEqual([]);
  });

  it("Twixer のURLは、ハンドルが投稿の作者と違うとカードにしない", () => {
    // 実在する投稿IDでも、URLのハンドルが作者でなければ他人の投稿をカードにしない
    expect(resolveLinkEmbeds("https://twixer.com/nobody/status/post-101")).toEqual([]);
    expect(resolveLinkEmbeds("twixer.com/mai2mai2_fake/status/post-101")).toEqual([]);
    // 作者のハンドルなら従来どおりカードになる
    expect(resolveLinkEmbeds(POST_101_URL)[0]?.href).toBe("/twitter/post/post-101");
  });
});

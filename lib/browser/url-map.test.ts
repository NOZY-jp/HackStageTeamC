import { describe, expect, it } from "vitest";
import { APP_PREFIX, dmListPath } from "@/lib/platform/app-prefix";
import { resolveOmniboxInput, toDisplayUrl } from "./url-map";

/** 内部パスを pathname と search に分ける（search は `?` を含む）。 */
function splitInternalPath(path: string): [pathname: string, search: string] {
  const index = path.indexOf("?");
  return index === -1 ? [path, ""] : [path.slice(0, index), path.slice(index)];
}

/** アドレスバーの表示 URL をそのまま Enter したときに表示される URL。 */
function resubmitDisplayUrl(displayUrl: string): string {
  const [pathname, search] = splitInternalPath(resolveOmniboxInput(displayUrl));
  return toDisplayUrl(pathname, search);
}

describe("lib/browser/url-map", () => {
  describe("toDisplayUrl", () => {
    it("Discord の内部ルートを discord.com/... に変換する", () => {
      expect(toDisplayUrl(dmListPath())).toBe("discord.com/channels/@me");
      expect(toDisplayUrl(`/${APP_PREFIX}/channels/%40me`)).toBe("discord.com/channels/@me");
      expect(toDisplayUrl(`/${APP_PREFIX}/channels/1187002356428840961/1187002356428840973`)).toBe(
        "discord.com/channels/1187002356428840961/1187002356428840973",
      );
      expect(toDisplayUrl(`/${APP_PREFIX}`)).toBe("discord.com");
    });

    it("Twixer のルートを twixer.com/... に変換する（プロフィールは /profile を省略）", () => {
      expect(toDisplayUrl("/twitter")).toBe("twixer.com");
      expect(toDisplayUrl("/twitter/search", "q=ブログ")).toBe("twixer.com/search?q=ブログ");
      expect(toDisplayUrl("/twitter/profile/mai2mai2")).toBe("twixer.com/mai2mai2");
      expect(toDisplayUrl("/twitter/profile/kanon__dayo/media")).toBe(
        "twixer.com/kanon__dayo/media",
      );
      expect(toDisplayUrl("/twitter/post/post-101")).toBe("twixer.com/post/post-101");
      expect(toDisplayUrl("/twitter/messages/conv-1")).toBe("twixer.com/messages/conv-1");
    });

    it("ぽちブロ・leaf・talkup・Seek の内部ルートを作中 URL に変換する", () => {
      expect(toDisplayUrl("/pochiblo/denden0102")).toBe("pochiblo.jp/denden0102");
      expect(toDisplayUrl("/pochiblo/denden0102/entry/e20200211")).toBe(
        "pochiblo.jp/denden0102/entry/e20200211",
      );
      expect(toDisplayUrl("/pochiblo/mylist/k7q2m9d4")).toBe("pochiblo.jp/mylist/k7q2m9d4");

      expect(toDisplayUrl("/note")).toBe("leaf.jp");
      expect(toDisplayUrl("/note/maimai")).toBe("leaf.jp/maimai");
      expect(toDisplayUrl("/note/search", "q=%E3%83%A2%E3%83%B3%E3%83%8F%E3%83%B3")).toBe(
        "leaf.jp/search?q=モンハン",
      );

      expect(toDisplayUrl("/talkup")).toBe("talkup.jp");
      expect(toDisplayUrl("/talkup", "q=%E3%83%86%E3%82%B9%E3%83%88")).toBe("talkup.jp/?q=テスト");
      expect(toDisplayUrl("/talkup/profile/yui__photo")).toBe("talkup.jp/profile/yui__photo");

      expect(toDisplayUrl("/search")).toBe("seek.jp");
      expect(toDisplayUrl("/search", "q=%E8%92%BC%E7%A9%B9")).toBe("seek.jp/?q=蒼穹");

      expect(toDisplayUrl("/soukyuu-photo")).toBe("soukyuu-photo.jp");
      expect(toDisplayUrl("/soukyuu-photo/2020/result")).toBe("soukyuu-photo.jp/2020/result");
      expect(toDisplayUrl("/soukyuu-photo/contact")).toBe("soukyuu-photo.jp/contact");
    });

    it("検索語の予約文字を表示 URL に残し、再送信しても同じ検索語になる", () => {
      const queries = ["#素材", "A+B", "A&B=C", "100%", "a?b", "空白 あり", "蒼穹 #2020+α"];

      for (const query of queries) {
        const internalSearch = `?q=${encodeURIComponent(query)}`;
        const display = toDisplayUrl("/search", internalSearch);

        // 表示 URL に生の区切り文字（# や +）が混ざらない
        expect(display, query).not.toContain("#");
        expect(display, query).not.toContain("+");
        // アドレスバーの表示をそのまま Enter しても同じクエリへ戻る
        expect(resolveOmniboxInput(display), query).toBe(`/search?q=${encodeURIComponent(query)}`);
        // 日本語は読めるまま残す
        expect(display, query).toBe(toDisplayUrl("/search", internalSearch));
      }
    });
  });

  describe("resolveOmniboxInput", () => {
    it("作中ドメイン（スキームあり／なし）を内部ルートに解決する", () => {
      expect(resolveOmniboxInput("leaf.jp/maimai")).toBe("/note/maimai");
      expect(resolveOmniboxInput("https://leaf.jp/maimai/n/maimai-2020-02-screenshot")).toBe(
        "/note/maimai/n/maimai-2020-02-screenshot",
      );
      expect(resolveOmniboxInput("http://pochiblo.jp/denden0102")).toBe("/pochiblo/denden0102");
      expect(resolveOmniboxInput("pochiblo.jp/mylist/k7q2m9d4")).toBe("/pochiblo/mylist/k7q2m9d4");
      expect(resolveOmniboxInput("twixer.com/mai2mai2")).toBe("/twitter/profile/mai2mai2");
      expect(resolveOmniboxInput("twixer.com/hunter_denden0102/status/957104265840128001")).toBe(
        "/twitter/post/957104265840128001",
      );
      expect(resolveOmniboxInput("twixer.com")).toBe("/twitter");
      expect(resolveOmniboxInput("talkup.jp")).toBe("/talkup");
      expect(resolveOmniboxInput("discord.com")).toBe(dmListPath());
      expect(resolveOmniboxInput("discord.com/channels/@me/1187002356428841502")).toBe(
        `/${APP_PREFIX}/channels/@me/1187002356428841502`,
      );
      expect(resolveOmniboxInput("seek.jp")).toBe("/search");
      expect(resolveOmniboxInput("seek.jp/?q=蒼穹")).toBe("/search?q=%E8%92%BC%E7%A9%B9");
      expect(resolveOmniboxInput("soukyuu-photo.jp")).toBe("/soukyuu-photo");
      expect(resolveOmniboxInput("soukyuu-photo.jp/2020/result")).toBe(
        "/soukyuu-photo/2020/result",
      );
      expect(resolveOmniboxInput("https://soukyuu-photo.jp/contact")).toBe(
        "/soukyuu-photo/contact",
      );
    });

    it("先頭 / の内部パスはそのまま返す（// の外部スキーム相対パスは検索扱い）", () => {
      expect(resolveOmniboxInput("/pochiblo/denden0102")).toBe("/pochiblo/denden0102");
      expect(resolveOmniboxInput("//example.com")).toBe("/search?q=%2F%2Fexample.com");
    });

    it("未知のドメインや検索語は Seek 検索パスに変換する", () => {
      expect(resolveOmniboxInput("蒼穹フォトアワード 2020")).toBe(
        "/search?q=%E8%92%BC%E7%A9%B9%E3%83%95%E3%82%A9%E3%83%88%E3%82%A2%E3%83%AF%E3%83%BC%E3%83%89%202020",
      );
      expect(resolveOmniboxInput("https://example.com")).toBe(
        "/search?q=https%3A%2F%2Fexample.com",
      );
      expect(resolveOmniboxInput("leaf.jp のブログ")).toBe(
        "/search?q=leaf.jp%20%E3%81%AE%E3%83%96%E3%83%AD%E3%82%B0",
      );
      expect(resolveOmniboxInput("   ")).toBe("/search");
    });
  });

  describe("クエリの表示と再送信（エッジケース）", () => {
    it("複数クエリと予約文字を含む key を保ったまま往復する", () => {
      const internalSearch = new URLSearchParams([
        ["q", "#素材"],
        ["tag", "A+B"],
        ["分類", "&="],
      ]).toString();
      const display = toDisplayUrl("/search", `?${internalSearch}`);

      expect(display).toBe("seek.jp/?q=%23素材&tag=A%2BB&分類=%26%3D");
      expect(resolveOmniboxInput(display)).toBe(`/search?${internalSearch}`);
      expect(resubmitDisplayUrl(display)).toBe(display);
    });

    it("空値のクエリを落とさず往復する", () => {
      const display = toDisplayUrl("/search", "?q=");
      expect(display).toBe("seek.jp/?q=");
      expect(resolveOmniboxInput(display)).toBe("/search?q=");
      expect(resubmitDisplayUrl(display)).toBe(display);

      const twixer = toDisplayUrl("/twitter/search", "?q=");
      expect(twixer).toBe("twixer.com/search?q=");
      expect(resolveOmniboxInput(twixer)).toBe("/twitter/search?q=");
      expect(resubmitDisplayUrl(twixer)).toBe(twixer);

      // クエリ全体が空（`?` だけ）なら表示 URL にもクエリを残さない
      expect(toDisplayUrl("/search", "?")).toBe("seek.jp");
      expect(resolveOmniboxInput("seek.jp")).toBe("/search");
    });

    it("`%` `#` `+` `?` `&` `=` を含む検索語をそのまま再検索できる", () => {
      const query = "100% #1 + A?B&C=D";
      const internalSearch = `?q=${encodeURIComponent(query)}`;
      const display = toDisplayUrl("/search", internalSearch);

      expect(display).toBe("seek.jp/?q=100%25%20%231%20%2B%20A%3FB%26C%3DD");
      expect(display).not.toContain("#");
      expect(resolveOmniboxInput(display)).toBe(`/search?q=${encodeURIComponent(query)}`);
      expect(resubmitDisplayUrl(display)).toBe(display);
    });

    it("日本語と予約文字の混在した検索語を往復できる", () => {
      for (const query of ["蒼穹 & 素材 = 100%", "資料 #2020 + α ?", "検索&q=偽装"]) {
        const internalSearch = `?q=${encodeURIComponent(query)}`;
        const display = toDisplayUrl("/search", internalSearch);

        expect(display, query).not.toContain("#");
        expect(display, query).not.toContain("&q=");
        expect(resolveOmniboxInput(display), query).toBe(`/search?q=${encodeURIComponent(query)}`);
        expect(resubmitDisplayUrl(display), query).toBe(display);
      }
    });

    it("表示 URL の再送信で表示 URL が変わらない", () => {
      const cases: Array<[pathname: string, search: string]> = [
        ["/search", ""],
        ["/search", "?q=%E8%92%BC%E7%A9%B9"],
        ["/search", "?q=%23%E7%B4%A0%E6%9D%90&page=2"],
        ["/twitter/search", "?q=A%2BB%26C"],
        ["/twitter/profile/mai2mai2", "?q=%2388"],
        ["/note/search", "?q=%E3%83%A2%E3%83%B3%E3%83%8F%E3%83%B3%2B%26"],
        ["/talkup", "?q=%23%E9%9B%91%E8%AB%87%2B%3D"],
        ["/pochiblo/denden0102", "?ref=%E3%83%AA%E3%83%B3%E3%82%AF%26utm%3Dx"],
      ];

      for (const [pathname, search] of cases) {
        const display = toDisplayUrl(pathname, search);
        const label = `${pathname}${search}`;

        expect(display, label).not.toContain("#");
        expect(display, label).not.toContain(" ");
        expect(resubmitDisplayUrl(display), label).toBe(display);
        // 3 周しても安定している
        expect(resubmitDisplayUrl(resubmitDisplayUrl(display)), label).toBe(display);
      }
    });

    it("QUERY_SAFE_ASCII 以外の記号をすべて含んでも往復できる", () => {
      const query = "% # + ? & = \" < > [ ] { } | \\ ^ ` ; : @ / , ! $ ' ( ) * ~ 空白\tタブ";
      const internalSearch = `?q=${encodeURIComponent(query)}`;
      const display = toDisplayUrl("/search", internalSearch);

      expect(display).not.toContain("#");
      const [resolvedPathname, resolvedSearch] = splitInternalPath(resolveOmniboxInput(display));
      expect(resolvedPathname).toBe("/search");
      // 表示形式（%XX か生の sub-delims か）は問わず、復元される検索語が元と一致する
      expect(new URLSearchParams(resolvedSearch).get("q")).toBe(query);
      expect(resubmitDisplayUrl(display)).toBe(display);
    });

    it("Seek 以外の検索ルートでも往復が壊れない", () => {
      const query = "#素材 & 100% + α";
      const internalSearch = `?q=${encodeURIComponent(query)}`;

      const twitter = toDisplayUrl("/twitter/search", internalSearch);
      expect(twitter).toBe("twixer.com/search?q=%23素材%20%26%20100%25%20%2B%20α");
      expect(resolveOmniboxInput(twitter)).toBe(`/twitter/search${internalSearch}`);
      expect(resubmitDisplayUrl(twitter)).toBe(twitter);

      const note = toDisplayUrl("/note/search", internalSearch);
      expect(note).toBe("leaf.jp/search?q=%23素材%20%26%20100%25%20%2B%20α");
      expect(resolveOmniboxInput(note)).toBe(`/note/search${internalSearch}`);
      expect(resubmitDisplayUrl(note)).toBe(note);

      const talkup = toDisplayUrl("/talkup", internalSearch);
      expect(talkup).toBe("talkup.jp/?q=%23素材%20%26%20100%25%20%2B%20α");
      expect(resolveOmniboxInput(talkup)).toBe(`/talkup${internalSearch}`);
      expect(resubmitDisplayUrl(talkup)).toBe(talkup);
    });

    it("Unicode の行区切り・段落区切りを含む検索語も往復する", () => {
      for (const query of ["前\u2028後", "前\u2029後", "前\u0085後"]) {
        const label = JSON.stringify(query);
        const internalSearch = `?q=${encodeURIComponent(query)}`;
        const display = toDisplayUrl("/search", internalSearch);

        // 行区切りを生のまま出すと、resolveOmniboxInput のホスト判定が途切れて
        // 表示 URL 全体が検索語として扱われる
        expect(display, label).not.toContain("\u2028");
        expect(display, label).not.toContain("\u2029");
        expect(display, label).not.toContain("\u0085");
        expect(resolveOmniboxInput(display), label).toBe(`/search?q=${encodeURIComponent(query)}`);
        expect(resubmitDisplayUrl(display), label).toBe(display);
      }
    });
  });
});

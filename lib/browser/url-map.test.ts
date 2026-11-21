import { describe, expect, it } from "vitest";
import { APP_PREFIX, dmListPath } from "@/lib/platform/app-prefix";
import { resolveOmniboxInput, toDisplayUrl } from "./url-map";

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
});

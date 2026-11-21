import { describe, expect, it } from "vitest";
import { SITES, siteAt, unlockedSites } from "./sites";

describe("サイトの開放（ブックマーク）", () => {
  it("はじめは Discord だけ", () => {
    expect(unlockedSites([], [])).toEqual(["discord"]);
  });

  it("謎解きの段階に着くと、順に開放される", () => {
    expect(unlockedSites(["s01-blog-talk"], [])).toEqual(["discord", "twixer"]);
    expect(unlockedSites(["s01-blog-talk", "s03-blog-found"], [])).toEqual([
      "discord",
      "twixer",
      "oldBlog",
      "leaf",
    ]);
    expect(unlockedSites(["s09-kai-contact"], [])).toContain("talkup");
  });

  it("条件の前でも、実際に開いたサイトは開放する（締め出さない）", () => {
    expect(unlockedSites([], ["talkup"])).toEqual(["discord", "talkup"]);
  });

  it("URL からいまのサイトが分かる（似た別の URL は含めない）", () => {
    expect(siteAt("/twitter/profile/mai2mai2")).toBe("twixer");
    expect(siteAt("/twitter")).toBe("twixer");
    expect(siteAt("/twitterx")).toBeUndefined();
    expect(siteAt("/pochiblo/denden0102/entry/e20180127")).toBe("oldBlog");
    expect(siteAt("/note/mai_yoru")).toBe("leaf");
    expect(siteAt(SITES.discord.href)).toBe("discord");
    expect(siteAt("/story")).toBeUndefined();
  });
});

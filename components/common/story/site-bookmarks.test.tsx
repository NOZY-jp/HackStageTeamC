import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SITES } from "@/lib/story";
import { SiteBookmarks } from "./site-bookmarks";

describe("ブックマーク", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("開放したサイトだけを並べ、新しく開放したサイトを知らせる", async () => {
    await act(async () => {
      render(<SiteBookmarks pathname={SITES.discord.href} flags={["s01-blog-talk"]} />);
    });
    // 知らせ（Discord ははじめから開いているので知らせない）
    expect(screen.getByRole("status")).toHaveTextContent("ブックマークに追加しましたTwixer");
    fireEvent.click(screen.getByRole("button", { name: "ブックマーク" }));
    const links = screen.getAllByRole("link").filter((link) => link.className === "sb-item");
    expect(links.map((link) => link.textContent)).toEqual(["Discord", "Twixer"]);
  });

  it("開いたサイトは条件の前でも並び、いま開いているサイトは知らせない", async () => {
    await act(async () => {
      render(<SiteBookmarks pathname="/talkup" flags={[]} />);
    });
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "ブックマーク" }));
    expect(screen.getByRole("link", { name: "talkup" })).toHaveAttribute("aria-current", "page");
  });

  it("一度知らせたサイトは、もう一度は知らせない", async () => {
    window.localStorage.setItem(
      "hackstage:story-sites-announced:v1",
      JSON.stringify(["discord", "twixer"]),
    );
    await act(async () => {
      render(<SiteBookmarks pathname={SITES.discord.href} flags={["s01-blog-talk"]} />);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });
});

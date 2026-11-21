import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HAL_HANDLE } from "@/lib/discord-like/data/names";
import { RightSidebar } from "./right-sidebar";

describe("RightSidebar", () => {
  it("Suggestion list excludes self", () => {
    render(<RightSidebar />);
    const suggestions = screen.getByRole("region", { name: "おすすめユーザー" });
    const links = within(suggestions).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    expect(within(suggestions).queryByText(`@${HAL_HANDLE}`)).toBeNull();
    for (const link of links) {
      expect(link.getAttribute("href")).not.toBe(`/twitter/profile/${HAL_HANDLE}`);
    }
  });

  it("おすすめユーザーはフォロー中のアカウントだけ（かのんは出さない）", () => {
    render(<RightSidebar />);
    const suggestions = screen.getByRole("region", { name: "おすすめユーザー" });
    // リョウはかのんをまだ知らない（フォローしていない）のでおすすめに出ない
    expect(within(suggestions).queryByText("かのん")).toBeNull();
    expect(within(suggestions).queryByText("@kanon__dayo")).toBeNull();
    // フォロー中の Mai とソウは出る
    expect(within(suggestions).queryByText("@mai2mai2")).not.toBeNull();
    expect(within(suggestions).queryByText("@kaiser018023071")).not.toBeNull();
  });
});

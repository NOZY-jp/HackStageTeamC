import fs from "node:fs/promises";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DmNotFound } from "./dm-not-found";

describe("DmNotFound", () => {
  it("DM用の未検出文言を出す（チャンネル用の文言は出さない）", () => {
    render(<DmNotFound />);

    expect(screen.getByRole("heading", { name: "DMが見つかりません" })).toBeInTheDocument();
    expect(screen.getByText("一覧から相手を選び直してください。")).toBeInTheDocument();
    expect(screen.queryByText("チャンネルが見つかりません")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "DMへ戻る" })).toHaveAttribute(
      "href",
      "/discord.com/channels/@me",
    );
  });

  it("一覧（2列目）を残したまま、404 を3列目（メイン領域）に置く", async () => {
    const { container } = render(<DmNotFound />);
    const state = container.querySelector(".route-state");
    expect(state).toHaveClass("route-state--main");

    const css = await fs.readFile("app/globals.css", "utf8");
    // 既定の全幅指定（2列目から）は変えず、DM 用の修飾クラスだけ 3列目にする
    expect(css).toMatch(/\.route-state \{[^}]*grid-column: 2 \/ -1/);
    expect(css).toMatch(/\.route-state--main \{[^}]*grid-column: 3/);
    expect(css).toMatch(/\.route-state--main \{[^}]*grid-row: 1 \/ span 2/);
  });
});

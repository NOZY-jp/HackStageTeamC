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
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChannelNotFound } from "./channel-not-found";

describe("ChannelNotFound", () => {
  it("チャンネル用の未検出文言を出す（DM用の文言は出さない）", () => {
    render(<ChannelNotFound />);

    expect(screen.getByRole("heading", { name: "チャンネルが見つかりません" })).toBeInTheDocument();
    expect(screen.queryByText("DMが見つかりません")).not.toBeInTheDocument();
  });
});

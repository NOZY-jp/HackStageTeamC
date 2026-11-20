import fs from "node:fs/promises";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChannelNotFound } from "./channel-not-found";

describe("ChannelNotFound", () => {
  it("チャンネル用の未検出文言を出す（DM用の文言は出さない）", () => {
    render(<ChannelNotFound serverHref="/discord.com/channels/1/2" />);

    expect(screen.getByRole("heading", { name: "チャンネルが見つかりません" })).toBeInTheDocument();
    expect(screen.queryByText("DMが見つかりません")).not.toBeInTheDocument();
  });

  it("既定の戻り先はサーバー（最初のチャンネル）で、文言は「サーバーへ戻る」", () => {
    render(
      <ChannelNotFound serverHref="/discord.com/channels/1187002356428840961/1187002356428840962" />,
    );

    const link = screen.getByRole("link", { name: "サーバーへ戻る" });
    expect(link).toHaveAttribute(
      "href",
      "/discord.com/channels/1187002356428840961/1187002356428840962",
    );
    expect(screen.queryByRole("link", { name: "DMへ戻る" })).not.toBeInTheDocument();
  });

  it("一覧（2列目）を残したまま、404 を3列目（メイン領域）に置く", async () => {
    const { container } = render(<ChannelNotFound serverHref="/discord.com/channels/1/2" />);
    const state = container.querySelector(".route-state");
    expect(state).toHaveClass("route-state--main");

    const css = await fs.readFile("app/globals.css", "utf8");
    expect(css).toMatch(/\.route-state--main \{[^}]*grid-column: 3/);
    expect(css).toMatch(/\.route-state--main \{[^}]*grid-row: 1 \/ span 2/);
  });

  it("チャンネル未検出はレイアウト配下で描く（notFound ではなくコンポーネント）", async () => {
    const page = await fs.readFile(
      "app/(discord-like)/[app]/channels/[guildId]/[channelId]/page.tsx",
      "utf8",
    );
    // channel-missing でも ChannelNotFound を返し、レイアウトの一覧を残す
    expect(page).toContain("<ChannelNotFound");
    expect(page).toContain("guildChannelPath(guild.urlId, first.urlId)");
  });
});

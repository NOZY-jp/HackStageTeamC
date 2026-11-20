import fs from "node:fs/promises";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { listChannels } from "@/lib/discord-like";
import { dmListPath, guildChannelPath } from "@/lib/platform/app-prefix";
import { ChannelNotFound } from "./channel-not-found";
import { channelFallback } from "./channel-route-fallback";

const GUILD_URL_ID = "1187002356428840961";
const GUILD_ID = "mhc";
const FIRST_TEXT = listChannels(GUILD_ID).find((channel) => channel.kind === "text");

describe("チャンネル未検出の3ケース（#70）", () => {
  it("guild はあるが channel が無い: 一覧を残し、サーバーの最初のチャンネルへ戻る", () => {
    const fallback = channelFallback(GUILD_URL_ID);
    expect(fallback.hasServer).toBe(true);
    expect(fallback.label).toBe("サーバーへ戻る");
    expect(fallback.href).toBe(guildChannelPath(GUILD_URL_ID, FIRST_TEXT?.urlId ?? ""));

    const { container } = render(
      <ChannelNotFound
        serverHref={fallback.href}
        backLabel={fallback.label}
        withSidebar={fallback.hasServer}
      />,
    );
    // 一覧（2列目）があるので 3列目に置く
    expect(container.querySelector(".route-state")).toHaveClass("route-state--main");
    expect(screen.getByRole("link", { name: "サーバーへ戻る" })).toHaveAttribute(
      "href",
      fallback.href,
    );
  });

  it("guild 自体が無い: 一覧を出さず、DMへ戻る（文言とリンク先が一致）", () => {
    const fallback = channelFallback("does-not-exist");
    expect(fallback.hasServer).toBe(false);
    expect(fallback.label).toBe("DMへ戻る");
    expect(fallback.href).toBe(dmListPath());

    const { container } = render(
      <ChannelNotFound
        serverHref={fallback.href}
        backLabel={fallback.label}
        withSidebar={fallback.hasServer}
      />,
    );
    // 一覧が無いので全幅（2列目から）
    expect(container.querySelector(".route-state")).not.toHaveClass("route-state--main");
    expect(screen.getByRole("link", { name: "DMへ戻る" })).toHaveAttribute("href", dmListPath());
    expect(screen.queryByRole("link", { name: "サーバーへ戻る" })).not.toBeInTheDocument();
  });

  it("DM が無い: 一覧を残し、DMへ戻る（既存の挙動）", async () => {
    const { DmNotFound } = await import("./dm-not-found");
    const { container } = render(<DmNotFound />);
    expect(container.querySelector(".route-state")).toHaveClass("route-state--main");
    expect(screen.getByRole("link", { name: "DMへ戻る" })).toHaveAttribute("href", dmListPath());
  });

  it("レイアウトは guild が無いとき一覧（サイドバー）を描かない", async () => {
    const layout = await fs.readFile(
      "app/(discord-like)/[app]/channels/[guildId]/layout.tsx",
      "utf8",
    );
    // guild を引いて、無ければ ChannelSidebar を返さない分岐になっている
    expect(layout).toContain("const guild = getGuildByUrlId(segment)");
    expect(layout).toMatch(/if \(!guild\) \{\s*return null;/);
  });

  it("チャンネル未検出はページから channelFallback 経由で返す", async () => {
    const page = await fs.readFile(
      "app/(discord-like)/[app]/channels/[guildId]/[channelId]/page.tsx",
      "utf8",
    );
    expect(page).toContain("channelFallback(guildId)");
    expect(page).toContain("withSidebar={fallback.hasServer}");
  });
});

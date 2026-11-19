import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/discord-like/app-shell";
import { getChannel, getGuild } from "@/lib/discord-like";
import { guildChannelPath } from "@/lib/platform/app-prefix";
import { VoiceChannelView } from "./voice-channel-view";
import { VoiceProvider } from "./voice-context";

const guildUrlId = getGuild("mhc")?.urlId ?? "";
const vc1UrlId = getChannel("mhc-vc-1")?.urlId ?? "";
const vc2UrlId = getChannel("mhc-vc-2")?.urlId ?? "";
const vc1Path = guildChannelPath(guildUrlId, vc1UrlId);
const vc2Path = guildChannelPath(guildUrlId, vc2UrlId);

const nav = vi.hoisted(() => ({ path: "" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path }));

const participants = [{ id: "mina", displayName: "双剣ミナ", avatarColor: "#5865f2" }];
const currentUser = { id: "hal", displayName: "Hal", avatarColor: "#eb459e" };

function view(channelId: string, channelName: string, channelUrlId: string) {
  return (
    <VoiceChannelView
      guildId="mhc"
      guildUrlId={guildUrlId}
      channelId={channelId}
      channelUrlId={channelUrlId}
      channelName={channelName}
      participants={participants}
      currentUser={currentUser}
    />
  );
}

function shell(children: React.ReactNode) {
  return (
    <AppShell rail={<span />}>
      <VoiceProvider>{children}</VoiceProvider>
    </AppShell>
  );
}

function pane(name: string) {
  return within(screen.getByRole("main", { name }));
}

describe("VoiceChannelView", () => {
  it("開いた時点で接続状態になり、切断できる", async () => {
    nav.path = vc1Path;
    render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));

    expect(await pane("雑談通話").findByRole("button", { name: "切断" })).toBeInTheDocument();
  });

  it("「参加」ボタンは出ない", () => {
    nav.path = vc1Path;
    render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));

    expect(pane("雑談通話").queryByRole("button", { name: "参加" })).not.toBeInTheDocument();
  });

  it("参加者一覧に自分が入る", async () => {
    nav.path = vc1Path;
    render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));

    expect(await pane("雑談通話").findByText(/（自分）/)).toBeInTheDocument();
  });

  it("VC1 → VC2 → VC1 と往復すると、戻った VC1 でも接続状態になる", async () => {
    // ルートキャッシュを模して、両方の画面を同時にマウントしたままにする
    const both = () =>
      shell(
        <>
          {view("mhc-vc-1", "雑談通話", vc1UrlId)}
          {view("mhc-vc-2", "狩り募集", vc2UrlId)}
        </>,
      );
    nav.path = vc1Path;
    const { rerender } = render(both());
    expect(await pane("雑談通話").findByRole("button", { name: "切断" })).toBeInTheDocument();

    nav.path = vc2Path;
    rerender(both());
    expect(await pane("狩り募集").findByRole("button", { name: "切断" })).toBeInTheDocument();
    // 裏に残った VC1 が接続を奪い返さない
    expect(pane("雑談通話").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();

    nav.path = vc1Path;
    rerender(both());
    expect(await pane("雑談通話").findByRole("button", { name: "切断" })).toBeInTheDocument();
  });

  it("「切断」したあとは勝手に再接続しない", async () => {
    nav.path = vc1Path;
    render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));

    fireEvent.click(await pane("雑談通話").findByRole("button", { name: "切断" }));
    await waitFor(() => {
      expect(pane("雑談通話").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(pane("雑談通話").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
  });

  it("切断後に別の VC へ移ってから戻ると、また自動参加する", async () => {
    nav.path = vc1Path;
    const { rerender } = render(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));
    fireEvent.click(await pane("雑談通話").findByRole("button", { name: "切断" }));
    await waitFor(() => {
      expect(pane("雑談通話").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
    });

    nav.path = vc2Path;
    rerender(shell(view("mhc-vc-2", "狩り募集", vc2UrlId)));
    expect(await pane("狩り募集").findByRole("button", { name: "切断" })).toBeInTheDocument();

    nav.path = vc1Path;
    rerender(shell(view("mhc-vc-1", "雑談通話", vc1UrlId)));
    expect(await pane("雑談通話").findByRole("button", { name: "切断" })).toBeInTheDocument();
  });
});

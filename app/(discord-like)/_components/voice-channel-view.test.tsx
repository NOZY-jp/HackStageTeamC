import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/discord-like/app-shell";
import { VoiceChannelView } from "./voice-channel-view";
import { VoiceProvider } from "./voice-context";

const nav = vi.hoisted(() => ({ path: "/servers/s1/channels/s1-vc-1" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path }));

const participants = [{ id: "u4", displayName: "メンバー04", avatarColor: "#5865f2" }];
const currentUser = { id: "u1", displayName: "メンバー01", avatarColor: "#eb459e" };

function view(channelId: string, channelName: string) {
  return (
    <VoiceChannelView
      guildId="s1"
      channelId={channelId}
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
    nav.path = "/servers/s1/channels/s1-vc-1";
    render(shell(view("s1-vc-1", "ボイス 1")));

    expect(await pane("ボイス 1").findByRole("button", { name: "切断" })).toBeInTheDocument();
  });

  it("「参加」ボタンは出ない", () => {
    nav.path = "/servers/s1/channels/s1-vc-1";
    render(shell(view("s1-vc-1", "ボイス 1")));

    expect(pane("ボイス 1").queryByRole("button", { name: "参加" })).not.toBeInTheDocument();
  });

  it("参加者一覧に自分が入る", async () => {
    nav.path = "/servers/s1/channels/s1-vc-1";
    render(shell(view("s1-vc-1", "ボイス 1")));

    expect(await pane("ボイス 1").findByText(/（自分）/)).toBeInTheDocument();
  });

  it("VC1 → VC2 → VC1 と往復すると、戻った VC1 でも接続状態になる", async () => {
    // ルートキャッシュを模して、両方の画面を同時にマウントしたままにする
    const both = () =>
      shell(
        <>
          {view("s1-vc-1", "ボイス 1")}
          {view("s1-vc-2", "ボイス 2")}
        </>,
      );
    nav.path = "/servers/s1/channels/s1-vc-1";
    const { rerender } = render(both());
    expect(await pane("ボイス 1").findByRole("button", { name: "切断" })).toBeInTheDocument();

    nav.path = "/servers/s1/channels/s1-vc-2";
    rerender(both());
    expect(await pane("ボイス 2").findByRole("button", { name: "切断" })).toBeInTheDocument();
    // 裏に残った VC1 が接続を奪い返さない
    expect(pane("ボイス 1").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();

    nav.path = "/servers/s1/channels/s1-vc-1";
    rerender(both());
    expect(await pane("ボイス 1").findByRole("button", { name: "切断" })).toBeInTheDocument();
  });

  it("「切断」したあとは勝手に再接続しない", async () => {
    nav.path = "/servers/s1/channels/s1-vc-1";
    render(shell(view("s1-vc-1", "ボイス 1")));

    fireEvent.click(await pane("ボイス 1").findByRole("button", { name: "切断" }));
    await waitFor(() => {
      expect(pane("ボイス 1").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(pane("ボイス 1").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
  });

  it("切断後に別の VC へ移ってから戻ると、また自動参加する", async () => {
    nav.path = "/servers/s1/channels/s1-vc-1";
    const { rerender } = render(shell(view("s1-vc-1", "ボイス 1")));
    fireEvent.click(await pane("ボイス 1").findByRole("button", { name: "切断" }));
    await waitFor(() => {
      expect(pane("ボイス 1").queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
    });

    nav.path = "/servers/s1/channels/s1-vc-2";
    rerender(shell(view("s1-vc-2", "ボイス 2")));
    expect(await pane("ボイス 2").findByRole("button", { name: "切断" })).toBeInTheDocument();

    nav.path = "/servers/s1/channels/s1-vc-1";
    rerender(shell(view("s1-vc-1", "ボイス 1")));
    expect(await pane("ボイス 1").findByRole("button", { name: "切断" })).toBeInTheDocument();
  });
});

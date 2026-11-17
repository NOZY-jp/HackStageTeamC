import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "@/components/discord-like/app-shell";
import { VoiceChannelView } from "./voice-channel-view";
import { VoiceProvider } from "./voice-context";

function renderView() {
  return render(
    <AppShell rail={<span />}>
      <VoiceProvider>
        <VoiceChannelView
          guildId="s1"
          channelId="s1-vc-1"
          channelName="ボイス 1"
          participants={[{ id: "u4", displayName: "メンバー04", avatarColor: "#5865f2" }]}
          currentUser={{ id: "u1", displayName: "メンバー01", avatarColor: "#eb459e" }}
        />
      </VoiceProvider>
    </AppShell>,
  );
}

describe("VoiceChannelView", () => {
  it("開いた時点で接続状態になり、切断できる", async () => {
    renderView();

    expect(await screen.findByRole("button", { name: "切断" })).toBeInTheDocument();
  });

  it("「参加」ボタンは出ない", () => {
    renderView();

    expect(screen.queryByRole("button", { name: "参加" })).not.toBeInTheDocument();
  });

  it("参加者一覧に自分が入る", async () => {
    renderView();

    expect(await screen.findByText(/（自分）/)).toBeInTheDocument();
  });
});

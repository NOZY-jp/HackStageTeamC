import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { useVoice, VoiceProvider } from "../../app/(discord-like)/_components/voice-context";
import { SidebarUserPanel } from "./sidebar-user-panel";

/** 接続中を再現するための小さな補助（描画時に1回だけ join する） */
function JoinOnMount() {
  const { join } = useVoice();
  useEffect(() => {
    join({ guildId: "s1", channelId: "s1-vc-1", channelName: "ボイス 1" });
  }, [join]);
  return null;
}

function renderPanel({ connected = false }: { connected?: boolean } = {}) {
  return render(
    <VoiceProvider>
      {connected ? <JoinOnMount /> : null}
      <SidebarUserPanel userId="u1" />
    </VoiceProvider>,
  );
}

describe("SidebarUserPanel", () => {
  it("名前の下は既定でステータス文言を出す", () => {
    render(
      <VoiceProvider>
        <SidebarUserPanel userId="u4" />
      </VoiceProvider>,
    );

    expect(screen.getByText("メンバー04")).toBeInTheDocument();
    expect(screen.getByText("オンライン")).toBeInTheDocument();
  });

  it("idle は「退席中」と表示し、ハンドルに @ を付けない", () => {
    const { container } = render(
      <VoiceProvider>
        <SidebarUserPanel userId="u1" />
      </VoiceProvider>,
    );

    expect(screen.getByText("退席中")).toBeInTheDocument();
    expect(screen.getByText("member01")).toBeInTheDocument();
    expect(container.textContent).not.toContain("@member01");
  });

  it("ボイス操作のアイコンボタンが5つあり、すべてにアクセシブル名がある", () => {
    renderPanel();

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    for (const button of buttons) {
      expect(button).toHaveAccessibleName();
    }
  });

  it("未接続では通話ブロックを出さない", () => {
    renderPanel();

    expect(screen.queryByText("通話中")).not.toBeInTheDocument();
    expect(screen.queryByText("Krisp によるノイズ抑制")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
  });

  it("接続中は 通話中 / チャンネル名 / サーバー名 / Krisp / 切断 を順に出す", () => {
    const { container } = renderPanel({ connected: true });

    expect(screen.getByText("通話中")).toBeInTheDocument();
    expect(screen.getByText("ボイス 1 / 開発ラボ")).toBeInTheDocument();
    expect(screen.getByText("Krisp によるノイズ抑制")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切断" })).toBeInTheDocument();

    // DOM順（上から）: 通話中 → チャンネル/サーバー → Krisp → 切断
    const text = container.textContent ?? "";
    const order = ["通話中", "ボイス 1 / 開発ラボ", "Krisp によるノイズ抑制", "切断"].map((t) =>
      text.indexOf(t),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("切断すると通話ブロックが消える", () => {
    renderPanel({ connected: true });

    fireEvent.click(screen.getByRole("button", { name: "切断" }));

    expect(screen.queryByText("通話中")).not.toBeInTheDocument();
    expect(screen.queryByText("Krisp によるノイズ抑制")).not.toBeInTheDocument();
  });
});

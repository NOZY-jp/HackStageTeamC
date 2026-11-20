import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/discord-like/app-shell";
import { dmThreadPath } from "@/lib/platform/app-prefix";
import { DmCallView } from "./dm-call-view";
import { LocalMessagesProvider, useLocalMessages } from "./local-messages-context";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/discord.com/channels/@me/1187002356428841501/call",
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

const threadUrlId = "1187002356428841501";
const self = { displayName: "琥珀", avatarColor: "#5865f2" };
const other = { displayName: "MaiMai", avatarColor: "#eb459e" };

function Log() {
  const { messagesFor } = useLocalMessages();
  const messages = messagesFor("dm-maimai");
  return (
    <>
      <p data-testid="log">{messages.map((m) => m.body).join(" / ")}</p>
      {/* 文言だけでなく、システム行として積まれていること（system === true）を検査する */}
      <p data-testid="log-system">{messages.map((m) => String(m.system === true)).join(" / ")}</p>
    </>
  );
}

const view = () => (
  <AppShell rail={<span />}>
    <LocalMessagesProvider>
      <DmCallView threadId="dm-maimai" threadUrlId={threadUrlId} self={self} other={other} />
      <Log />
    </LocalMessagesProvider>
  </AppShell>
);

beforeEach(() => {
  push.mockClear();
});

describe("DM の通話画面（#137）", () => {
  it("相手と自分の2人を出し、相手を大きく・自分を小窓に置く", async () => {
    const { container } = render(view());
    const main = await screen.findByRole("main", { name: "MaiMai との通話" });
    expect(within(main).getByText("MaiMai")).toBeInTheDocument();
    expect(within(main).getByText("琥珀（自分）")).toBeInTheDocument();
    expect(main.querySelector(".call-stage-status")?.textContent).toBe("接続中");
    expect(container.querySelectorAll(".call-tile")).toHaveLength(2);
    // DM 用のレイアウト（相手が大きく、自分は右下の小窓）
    expect(container.querySelector(".call-tiles")?.getAttribute("data-layout")).toBe("dm");
    const css = await import("node:fs/promises").then((fs) =>
      fs.readFile("app/globals.css", "utf8"),
    );
    expect(css).toMatch(
      /\.call-tiles\[data-layout="dm"\] \.call-tile:nth-child\(2\) \{[^}]*position: absolute/,
    );
  });

  it("操作バーはホバー中だけ出て、外すと消える（#134 と同じ作法）", async () => {
    const { container } = render(view());
    await screen.findByRole("main", { name: "MaiMai との通話" });
    const stage = container.querySelector(".call-stage");
    const controls = container.querySelector(".call-controls");
    if (!stage || !controls) throw new Error("stage missing");
    expect(controls.getAttribute("data-visible")).toBe("false");
    fireEvent.pointerEnter(stage);
    expect(controls.getAttribute("data-visible")).toBe("true");
    fireEvent.pointerLeave(stage);
    expect(controls.getAttribute("data-visible")).toBe("false");
  });

  it("開始でログに残り、終了でDMチャットへ戻る", async () => {
    const { container } = render(view());
    await screen.findByRole("main", { name: "MaiMai との通話" });
    // 開始のログ
    await waitFor(() => {
      expect(screen.getByTestId("log").textContent).toContain("通話を開始しました");
    });
    // 操作はホバーで出す
    const stage = container.querySelector(".call-stage");
    if (!stage) throw new Error("stage missing");
    fireEvent.pointerEnter(stage);
    fireEvent.click(screen.getByRole("button", { name: "切断" }));
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(dmThreadPath(threadUrlId));
    });
    expect(screen.getByTestId("log").textContent).toContain("通話を終了しました");
    expect(screen.queryByRole("button", { name: "切断" })).not.toBeInTheDocument();
  });
});

describe("通話の終了と重複防止（#140）", () => {
  it("「チャットに戻る」でも通話を終了し、開始ログが孤立しない", async () => {
    const { unmount } = render(view());
    await screen.findByRole("main", { name: "MaiMai との通話" });
    await waitFor(() => {
      expect(screen.getByTestId("log").textContent).toContain("通話を開始しました");
    });

    // ヘッダーの「チャットに戻る」で終了ログを残す（開始だけの孤立を作らない）
    fireEvent.click(screen.getByRole("link", { name: "チャットに戻る" }));
    await waitFor(() => {
      expect(screen.getByTestId("log").textContent).toContain("通話を終了しました");
    });
    expect(screen.getByTestId("log-system").textContent).toBe("true / true");
    unmount();
  });
});

describe("「チャットに戻る」で通話を終える（#140）", () => {
  it("「チャットに戻る」でも通話を終了し、開始ログが孤立しない", async () => {
    render(view());
    await screen.findByRole("main", { name: "MaiMai との通話" });
    await waitFor(() => {
      expect(screen.getByTestId("log").textContent).toContain("通話を開始しました");
    });

    // ヘッダーの「チャットに戻る」で終了ログを残す（開始だけの孤立を作らない）
    fireEvent.click(screen.getByRole("link", { name: "チャットに戻る" }));
    await waitFor(() => {
      expect(screen.getByTestId("log").textContent).toContain("通話を終了しました");
    });
    expect(screen.getByTestId("log-system").textContent).toBe("true / true");
  });
});

describe("入場→退出→再入場（#140）", () => {
  function Harness({ showCall }: { showCall: boolean }) {
    return (
      <AppShell rail={<span />}>
        <LocalMessagesProvider>
          {showCall ? (
            <DmCallView threadId="dm-maimai" threadUrlId={threadUrlId} self={self} other={other} />
          ) : (
            <p>チャット</p>
          )}
          <Log />
        </LocalMessagesProvider>
      </AppShell>
    );
  }

  it("2回目の入場でも connected が true で、開始/終了が履歴に積まれる", async () => {
    const { container, rerender } = render(<Harness showCall />);
    await screen.findByRole("main", { name: "MaiMai との通話" });
    await waitFor(() => {
      expect(screen.getByTestId("log").textContent).toContain("通話を開始しました");
    });
    fireEvent.click(screen.getByRole("link", { name: "チャットに戻る" }));
    await waitFor(() => {
      expect(screen.getByTestId("log").textContent).toContain("通話を終了しました");
    });

    // チャットへ（同じ Provider のまま）。SPA で同じ画面へ戻る想定
    rerender(<Harness showCall={false} />);
    expect(screen.getByText("チャット")).toBeInTheDocument();

    rerender(<Harness showCall />);
    await screen.findByRole("main", { name: "MaiMai との通話" });
    // 2回目も接続状態から始まる（前回の connected=false を持ち越さない）
    expect(container.querySelector(".call-stage")?.getAttribute("data-connected")).toBe("true");
    await waitFor(() => {
      expect(screen.getByTestId("log-system").textContent).toBe("true / true / true");
    });
    expect(screen.getByTestId("log").textContent?.match(/通話を開始しました/g)).toHaveLength(2);
  });
});

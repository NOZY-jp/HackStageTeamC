import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Activity, useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/discord-like/app-shell";
import { dmThreadPath } from "@/lib/platform/app-prefix";
import { DmCallView } from "./dm-call-view";
import { LocalMessagesProvider, useLocalMessages } from "./local-messages-context";
import { StartCallLink } from "./start-call-link";

const push = vi.fn();
// pathname をテストから動かせるようにする（実際の /call → /dm → /call の遷移を再現する）
let mockPathname = "/discord.com/channels/@me/1187002356428841501/call";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
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
      <DmCallView
        threadId="dm-maimai"
        threadUrlId={threadUrlId}
        self={self}
        other={other}
        connectDelayMs={0}
      />
      <Log />
    </LocalMessagesProvider>
  </AppShell>
);

beforeEach(() => {
  push.mockClear();
  mockPathname = "/discord.com/channels/@me/1187002356428841501/call";
});

describe("DM の通話画面（#137）", () => {
  it("相手と自分の2人を出し、相手を大きく・自分を小窓に置く", async () => {
    const { container } = render(view());
    const main = await screen.findByRole("main", { name: "MaiMai との通話" });
    expect(within(main).getAllByText("MaiMai").length).toBeGreaterThan(0);
    expect(within(main).getByText("琥珀（自分）")).toBeInTheDocument();
    // 呼び出し中→接続は非同期（effect）なので、接続まで待つ
    await waitFor(() =>
      expect(main.querySelector(".call-stage-status")?.textContent).toBe("接続中"),
    );
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

  it("通話中は操作バーが常に出る（PM決定）", async () => {
    const { container } = render(view());
    await screen.findByRole("main", { name: "MaiMai との通話" });
    const stage = container.querySelector(".call-stage");
    if (!stage) throw new Error("stage missing");
    // 接続（呼び出し中のあと）で操作バーが出るまで待つ
    await waitFor(() => expect(container.querySelector(".call-controls")).toBeTruthy());
    const controls = container.querySelector(".call-controls");
    if (!controls) throw new Error("controls missing");
    // 入った時点から常に表示（ホバーで出し入れしない）
    expect(controls.getAttribute("data-visible")).toBe("true");
    fireEvent.pointerEnter(stage);
    expect(controls.getAttribute("data-visible")).toBe("true");
    fireEvent.pointerLeave(stage);
    expect(controls.getAttribute("data-visible")).toBe("true");
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
    console.log("LOG", screen.getByTestId("log").textContent);
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

// Next はルートを Activity で保持する（アンマウントせず隠す）。
// 実ブラウザでは /call → /dm → /call で通話画面が再マウントされないため、
// チャット側の「通話を開始」リンク（StartCallLink）と Provider の通話状態で再入場を作る。
function Harness({ showCall }: { showCall: boolean }) {
  return (
    <AppShell rail={<span />}>
      <LocalMessagesProvider>
        <Activity mode={showCall ? "hidden" : "visible"}>
          <StartCallLink href={`${dmThreadPath(threadUrlId)}/call`} ariaLabel="通話を開始">
            <span>通話を開始</span>
          </StartCallLink>
        </Activity>
        <Activity mode={showCall ? "visible" : "hidden"}>
          <DmCallView
            threadId="dm-maimai"
            threadUrlId={threadUrlId}
            self={self}
            other={other}
            connectDelayMs={0}
          />
        </Activity>
        <Log />
      </LocalMessagesProvider>
    </AppShell>
  );
}

describe("入場→退出→再入場（#140）", () => {
  it("2回目の入場でも connected が true で、開始/終了が履歴に積まれる", async () => {
    mockPathname = "/discord.com/channels/@me/1187002356428841501/call";
    const { container, rerender } = render(<Harness showCall />);
    await screen.findByRole("main", { name: "MaiMai との通話" });
    await waitFor(() => {
      expect(screen.getByTestId("log").textContent).toContain("通話を開始しました");
    });

    // 「チャットに戻る」→ DM へ（同じ Provider のまま、通話画面は Activity で隠れる）
    fireEvent.click(screen.getByRole("link", { name: "チャットに戻る" }));
    mockPathname = "/discord.com/channels/@me/1187002356428841501";
    rerender(<Harness showCall={false} />);
    await waitFor(() => {
      expect(screen.getByTestId("log").textContent).toContain("通話を終了しました");
    });
    expect(container.querySelector(".call-stage")?.getAttribute("data-connected")).toBe("false");

    // チャットの「通話を開始」→ 同じスレッドへ再入場
    mockPathname = "/discord.com/channels/@me/1187002356428841501/call";
    fireEvent.click(screen.getByRole("link", { name: "通話を開始" }));
    rerender(<Harness showCall />);
    await screen.findByRole("main", { name: "MaiMai との通話" });
    await waitFor(() => {
      expect(container.querySelector(".call-stage")?.getAttribute("data-connected")).toBe("true");
    });
    expect(container.querySelector(".call-stage-status")?.textContent).toBe("接続中");
    await waitFor(() => {
      expect(screen.getByTestId("log-system").textContent).toBe("true / true / true");
    });
    expect(screen.getByTestId("log").textContent?.match(/通話を開始しました/g)).toHaveLength(2);
  });

  it("直リンクで開いても（末尾スラッシュ・%40 付きでも）開始ログが1件だけ積まれる", async () => {
    mockPathname = "/discord.com/channels/%40me/1187002356428841501/call/";
    const { container } = render(view());
    await screen.findByRole("main", { name: "MaiMai との通話" });
    await waitFor(() => {
      expect(screen.getByTestId("log").textContent).toContain("通話を開始しました");
    });
    expect(screen.getByTestId("log").textContent?.match(/通話を開始しました/g)).toHaveLength(1);
    expect(container.querySelector(".call-stage")?.getAttribute("data-connected")).toBe("true");
  });

  it("直リンクでも「通話は終了しました」を出さず、タイトルはヘッダーの1か所だけ", async () => {
    const { container } = render(view());
    await screen.findByRole("main", { name: "MaiMai との通話" });
    expect(screen.queryByText("通話は終了しました")).toBeNull();
    // ヘッダーの h1 以外にタイトルを出さない（ステージ内の h2 が無い）
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector(".call-stage h2")).toBeNull();
    // 相手の名前と経過時間はステージに出す
    expect(container.querySelector(".call-stage-timer")).toBeTruthy();
  });
});

function SeedActiveCall({ threadId }: { threadId: string }) {
  const { activeCallThreadId, startCall } = useLocalMessages();
  useEffect(() => {
    if (activeCallThreadId !== threadId) startCall(threadId);
  }, [activeCallThreadId, startCall, threadId]);
  return null;
}

describe("接続中に戻ったときのDM通話", () => {
  it("すでに接続中なら呼び出し中に戻さず、経過時間の起点も変えない", async () => {
    mockPathname = "/discord.com/channels/@me/1187002356428841501/call";
    const { container } = render(
      <AppShell rail={<span />}>
        <LocalMessagesProvider>
          <SeedActiveCall threadId="dm-maimai" />
          <DmCallView
            threadId="dm-maimai"
            threadUrlId={threadUrlId}
            self={self}
            other={other}
            connectDelayMs={1000}
          />
        </LocalMessagesProvider>
      </AppShell>,
    );
    await waitFor(() =>
      expect(container.querySelector(".call-stage-status")?.textContent).toBe("接続中"),
    );
    // 呼び出し中を経由しない（0:00 に戻さない）
    expect(container.querySelector(".call-stage")?.getAttribute("data-connecting")).toBe("false");
  });
});

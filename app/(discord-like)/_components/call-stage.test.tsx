import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CallStage } from "./call-stage";

const self = { id: "self", displayName: "琥珀（自分）", avatarColor: "#5865f2" };
const other = { id: "other", displayName: "MaiMai", avatarColor: "#eb459e" };
const base = {
  joined: true,
  muted: false,
  deafened: false,
  participants: [other, self],
  onToggleMute: vi.fn(),
  onToggleDeafen: vi.fn(),
  onLeave: vi.fn(),
  selfId: "self",
  layout: "dm" as const,
};

const showControls = (container: HTMLElement) => {
  const stage = container.querySelector(".call-stage");
  if (!stage) throw new Error("stage missing");
  fireEvent.pointerEnter(stage);
};

describe("通話ステージ（DM通話とVCの共通部品）", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T12:00:00+09:00"));
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("入室直後は「呼び出し中」で 0:00、操作バーは出さない", () => {
    const { container } = render(<CallStage {...base} joined={false} connecting />);
    expect(screen.getByText("呼び出し中")).toBeTruthy();
    expect(container.querySelector(".call-stage-timer")?.textContent).toContain("0:00");
    expect(container.querySelector('.call-stage[data-connecting="true"]')).toBeTruthy();
  });

  it("経過時間は joinedAt 起点（再入場しても戻らない）", () => {
    const startedAt = "2026-11-21T11:58:55+09:00"; // 65秒前
    const { container } = render(<CallStage {...base} startedAt={startedAt} />);
    expect(container.querySelector(".call-stage-timer")?.textContent).toContain("1:05");
  });

  it("発話は数秒おきに切り替わり、固定の「話しています」を出さない", () => {
    const { container } = render(<CallStage {...base} speakingIntervalMs={3000} />);
    const tiles = () => [...container.querySelectorAll(".call-tile")];
    expect(tiles().some((tile) => tile.getAttribute("data-speaking") === "true")).toBe(false);
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelectorAll('.call-tile[data-speaking="true"]').length).toBeGreaterThan(
      0,
    );
  });

  it("動きを減らす設定では発話の切り替えをしない", () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal("matchMedia", matchMedia);
    const { container } = render(<CallStage {...base} speakingIntervalMs={1000} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(container.querySelectorAll('.call-tile[data-speaking="true"]')).toHaveLength(0);
  });

  it("画面共有を押すと共有中の表示になり、もう一度で戻る", () => {
    const { container } = render(<CallStage {...base} />);
    showControls(container);
    const button = screen.getByRole("button", { name: "画面共有" });
    fireEvent.click(button);
    expect(screen.getByText("画面を共有しています")).toBeTruthy();
    expect(container.querySelector('.call-stage[data-sharing="true"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "共有を停止" }));
    expect(screen.queryByText("画面を共有しています")).toBeNull();
  });

  it("参加者一覧を開くと名前とミュート状態が出る", () => {
    const { container } = render(
      <CallStage {...base} participants={[other, { ...self, muted: true }]} />,
    );
    showControls(container);
    fireEvent.click(screen.getByRole("button", { name: "参加者一覧" }));
    const panel = screen.getByRole("complementary", { name: "参加者一覧" });
    expect(panel.textContent).toContain("MaiMai");
    expect(panel.textContent).toContain("琥珀（自分）");
    expect(panel.querySelectorAll('.call-participants-mic[data-state="muted"]')).toHaveLength(1);
  });

  it("招待はリンクをコピーして案内を出す", async () => {
    const { container } = render(<CallStage {...base} inviteUrl="https://example.com/invite" />);
    showControls(container);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "招待リンクをコピー" }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.com/invite");
    expect(screen.getByRole("status").textContent).toContain("招待リンクをコピーしました");
  });
});

describe("レイアウトのリグレッション防止", () => {
  it("VC3人は同サイズ3列（span 2 を使わない）", async () => {
    const css = await import("node:fs/promises").then((fs) =>
      fs.readFile("app/globals.css", "utf8"),
    );
    expect(css).not.toMatch(
      /\.call-tiles\[data-count="3"\] \.call-tile:first-child \{\s*grid-row: span 2/,
    );
    expect(css).toMatch(
      /\[data-layout="grid"\]\[data-count="3"\] \{[^}]*grid-template-columns: repeat\(3,/,
    );
    // 4人は2×2
    expect(css).toMatch(/\.call-tiles\[data-count="4"\] \{[^}]*repeat\(2,/);
  });

  it("DMの相手アバターは160px以上", async () => {
    const css = await import("node:fs/promises").then((fs) =>
      fs.readFile("app/globals.css", "utf8"),
    );
    expect(css).toMatch(
      /\.call-tiles\[data-layout="dm"\] \.call-tile:first-child \.call-tile-avatar \{[^}]*clamp\(160px/,
    );
  });

  it("3人を渡すと3枚のタイルを data-count=3 で描く", () => {
    const three = [
      { id: "a", displayName: "A", avatarColor: "#111111" },
      { id: "b", displayName: "B", avatarColor: "#222222" },
      { id: "c", displayName: "C", avatarColor: "#333333" },
    ];
    const { container } = render(
      <CallStage {...base} layout="grid" participants={three} selfId={undefined} />,
    );
    const list = container.querySelector(".call-tiles");
    expect(list?.getAttribute("data-count")).toBe("3");
    expect(list?.querySelectorAll(".call-tile")).toHaveLength(3);
  });
});

describe("画面共有中のレイアウト", () => {
  it("共有中に右へ寄せるのはVCだけで、DMの相手タイルは縮めない", async () => {
    const css = await import("node:fs/promises").then((fs) =>
      fs.readFile("app/globals.css", "utf8"),
    );
    expect(css).toMatch(
      /\.call-stage\[data-sharing="true"\] \.call-tiles\[data-layout="grid"\] \{[^}]*flex-direction: column/,
    );
    // DMは相手を消さず、右上の小窓に残す
    expect(css).toMatch(
      /\.call-stage\[data-sharing="true"\] \.call-tiles\[data-layout="dm"\] \.call-tile:first-child \{[^}]*position: absolute/,
    );
    // 共有中の自分は幅を確保（名前を切らない）
    expect(css).toMatch(
      /\.call-stage\[data-sharing="true"\] \.call-tiles\[data-layout="dm"\] \.call-tile:nth-child\(2\) \{[^}]*width: min\(240px/,
    );
  });
});

describe("共有を止めた後の通常表示", () => {
  it("小窓用の56pxアバターは共有中だけに効く（通常は160px以上）", async () => {
    const css = await import("node:fs/promises").then((fs) =>
      fs.readFile("app/globals.css", "utf8"),
    );
    // 素の（共有中でない）DMタイルに56pxを当てない
    expect(css).not.toMatch(
      /(^|\n)\.call-tiles\[data-layout="dm"\] \.call-tile:first-child \.call-tile-avatar \{[^}]*width: 56px/,
    );
    expect(css).toMatch(
      /\.call-stage\[data-sharing="true"\]\s+\.call-tiles\[data-layout="dm"\]\s+\.call-tile:first-child\s+\.call-tile-avatar \{[^}]*width: 56px/,
    );
    // 通常時は clamp(160px…) が残っている
    expect(css).toMatch(
      /\.call-tiles\[data-layout="dm"\] \.call-tile:first-child \.call-tile-avatar \{[^}]*clamp\(160px/,
    );
  });
});

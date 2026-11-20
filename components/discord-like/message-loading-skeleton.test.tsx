import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";
import { MessageLoadingSkeleton } from "./message-loading-skeleton";

const nav = { path: "/discord.com/channels/1/2" };
vi.mock("next/navigation", () => ({
  usePathname: () => nav.path,
}));

const renderSkeleton = () =>
  render(
    <AppShell rail={null}>
      <MessageLoadingSkeleton />
    </AppShell>,
  );

describe("チャンネル切替中のメッセージスケルトン（#70）", () => {
  it("見切れ行1つと通常行6つを出す", () => {
    const { container } = renderSkeleton();
    const rows = container.querySelectorAll(".message-loading-row");
    expect(rows).toHaveLength(7);
    expect(container.querySelectorAll(".message-loading-row--partial")).toHaveLength(1);
    expect(
      container.querySelectorAll(".message-loading-row:not(.message-loading-row--partial)"),
    ).toHaveLength(6);
  });

  it("通常行はアバター＋名前バー＋本文バー2本で、バーの長さが揃っていない", () => {
    const { container } = renderSkeleton();
    const rows = [
      ...container.querySelectorAll(".message-loading-row:not(.message-loading-row--partial)"),
    ];
    const widths = new Set<string>();
    for (const row of rows) {
      expect(row.querySelector(".message-loading-avatar")).not.toBeNull();
      expect(row.querySelector(".message-loading-name")).not.toBeNull();
      const lines = row.querySelectorAll(".message-loading-line");
      expect(lines).toHaveLength(2);
      for (const line of lines) {
        widths.add(line.getAttribute("style") ?? "");
      }
    }
    expect(widths.size).toBeGreaterThan(1);
  });

  it("スクリーンリーダー用の非表示テキストだけを読み上げ対象にする", () => {
    const { container } = renderSkeleton();
    const status = screen.getByRole("status");
    expect(status.className).toBe("visually-hidden");
    expect(status.textContent).toBe("メッセージを読み込んでいます");
    // 可視テキストは無い（旧「チャンネルを読み込んでいます」を出さない）
    const visible = [...container.querySelectorAll("p")].filter(
      (node) => node.getAttribute("role") !== "status",
    );
    expect(visible).toHaveLength(0);
    expect(container.textContent).not.toContain("チャンネルを読み込んでいます");
  });

  it("ヘッダーと入力欄の高さを実物と同じに保つ", () => {
    const { container } = renderSkeleton();
    expect(container.querySelector("main#app-main.app-main")).not.toBeNull();
    expect(container.querySelector(".app-main-body .pane-header")).not.toBeNull();
    expect(container.querySelector(".message-scroll")).not.toBeNull();
    expect(container.querySelector(".message-composer-area .message-composer")).not.toBeNull();
  });

  it("アバターは円・バーは pill で、角丸を CSS 側で定義している", async () => {
    const fs = await import("node:fs/promises");
    const css = await fs.readFile("app/globals.css", "utf8");
    expect(css).toMatch(/\.message-loading-avatar \{[^}]*border-radius: 50%/);
    expect(css).toMatch(/\.message-loading-line \{[^}]*border-radius: 999px/);
    // 濃淡2段（バーは共通の明るい段、アバターだけ濃い段）
    expect(css).toMatch(/\.skeleton-block \{[^}]*background-color: var\(--color-bg-input\)/);
    expect(css).toMatch(
      /\.message-loading-avatar \{[^}]*background-color: var\(--color-bg-sidebar\)/,
    );
    // 動きを減らす設定を尊重する
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
  });
});

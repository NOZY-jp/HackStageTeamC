import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkifiedText } from "./linkify";

describe("LinkifiedText", () => {
  it("URL を外部リンクにする（末尾の句読点はリンクに含めない）", () => {
    render(<LinkifiedText text="詳細→ https://example.com/news/mainte-1112 を見て。" />);
    const link = screen.getByRole("link", { name: "https://example.com/news/mainte-1112" });
    expect(link).toHaveAttribute("href", "https://example.com/news/mainte-1112");
    expect(link).toHaveClass("tw-inline-link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("@handle をプロフィールへのリンクにする", () => {
    render(<LinkifiedText text="@mai その人、いまも毎日インしてるらしい。" />);
    const link = screen.getByRole("link", { name: "@mai" });
    expect(link).toHaveAttribute("href", "/twitter/profile/mai");
    expect(link).toHaveClass("tw-inline-link");
  });

  it("メールアドレス中の @ はリンクにしない", () => {
    const { container } = render(<LinkifiedText text="連絡は mai@example.com まで" />);
    expect(container.querySelector("a")).toBeNull();
    expect(container).toHaveTextContent("連絡は mai@example.com まで");
  });

  it("URL・メンションのない文字列はそのまま表示する", () => {
    const { container } = render(<LinkifiedText text="普通の投稿文です。" />);
    expect(container.querySelector("a")).toBeNull();
    expect(container).toHaveTextContent("普通の投稿文です。");
  });
});

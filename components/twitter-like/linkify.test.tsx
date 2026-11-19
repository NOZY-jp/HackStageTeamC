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

  it("URL 直後の日本語はリンクに含めない", () => {
    const { container } = render(<LinkifiedText text="https://example.com/aを見て" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/a");
    expect(container).toHaveTextContent("を見て");
  });

  it("半角 (…) で囲まれた URL は末尾の ) をリンクに含めない", () => {
    const { container } = render(<LinkifiedText text="(https://example.com/a)" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/a");
    expect(container).toHaveTextContent("(https://example.com/a)");
  });

  it("URL 内の ( ) が釣り合っている末尾 ) はリンクに残す", () => {
    render(<LinkifiedText text="https://example.com/wiki/Foo_(bar) を参照" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/wiki/Foo_(bar)");
  });

  it("「…」で囲まれた URL は括弧をリンクに含めない", () => {
    const { container } = render(<LinkifiedText text="「https://example.com/a」" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/a");
    expect(container).toHaveTextContent("「https://example.com/a」");
  });

  it("存在しない handle のメンションはリンクにしない", () => {
    const { container } = render(<LinkifiedText text="@unknown_user この人誰だろう" />);
    expect(container.querySelector("a")).toBeNull();
    expect(container).toHaveTextContent("@unknown_user この人誰だろう");
  });

  it("存在する handle でも末尾ハイフンはリンクに含めない", () => {
    const { container } = render(<LinkifiedText text="@mai-さん に確認" />);
    expect(screen.getByRole("link", { name: "@mai" })).toHaveAttribute(
      "href",
      "/twitter/profile/mai",
    );
    expect(container).toHaveTextContent("-さん に確認");
  });

  it("URL末尾の混在記号は元の順序のまま再出力する", () => {
    const { container } = render(<LinkifiedText text="(https://example.com/a)." />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/a");
    expect(container).toHaveTextContent("(https://example.com/a).");
  });

  it("URL内部の対応しない ) は URL 文字として維持される", () => {
    const { container } = render(<LinkifiedText text="https://example.com/wiki/)(bar)" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/wiki/)(bar)");
  });

  it("対応しない ) が内部にあるURLも途中で切らない", () => {
    const { container } = render(<LinkifiedText text="https://example.com/a)b 参照" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/a)b");
    expect(container).toHaveTextContent(" 参照");
  });

  it("連続ハイフンを含む未知メンションはリンクにしない", () => {
    const { container } = render(<LinkifiedText text="@mai--unknown です" />);
    expect(container.querySelector("a")).toBeNull();
    expect(container).toHaveTextContent("@mai--unknown です");
  });
});

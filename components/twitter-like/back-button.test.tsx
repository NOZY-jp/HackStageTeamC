import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BackButton } from "./back-button";

const setReferrer = (value: string) => {
  Object.defineProperty(window.document, "referrer", { value, configurable: true });
};

describe("Twixer の戻る（#249）", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/twitter/search?q=モンハン&f=user");
    setReferrer("");
  });

  it("同じオリジンの履歴があれば1つ戻る（検索の q/f は履歴側で保たれる）", () => {
    setReferrer(`${window.location.origin}/twitter/search?q=モンハン&f=user`);
    Object.defineProperty(window.history, "length", { value: 3, configurable: true });
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<BackButton fallbackHref="/twitter" />);
    fireEvent.click(screen.getByRole("link", { name: "戻る" }));
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it("履歴が無ければ fallback への通常リンクのまま", () => {
    setReferrer("");
    Object.defineProperty(window.history, "length", { value: 1, configurable: true });
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<BackButton fallbackHref="/twitter/profile/mai2mai2" />);
    const link = screen.getByRole("link", { name: "戻る" });
    expect(link).toHaveAttribute("href", "/twitter/profile/mai2mai2");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });

  it("アプリ外から来た場合は戻らない", () => {
    setReferrer("https://example.com/foo");
    Object.defineProperty(window.history, "length", { value: 5, configurable: true });
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<BackButton fallbackHref="/twitter" />);
    const link = screen.getByRole("link", { name: "戻る" });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });
});

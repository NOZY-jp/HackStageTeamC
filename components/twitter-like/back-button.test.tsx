import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BackButton, isSameOriginReferrer } from "./back-button";
import { TWITTER_HISTORY_KEY, writeInternalHistoryCount } from "./history-tracker";

const setReferrer = (value: string) => {
  Object.defineProperty(window.document, "referrer", { value, configurable: true });
};

describe("Twixer の戻る（#249）", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/twitter/search?q=モンハン&f=user");
    window.sessionStorage.clear();
    setReferrer("");
  });

  it("referrer は URL の origin 完全一致で判定する", () => {
    const origin = window.location.origin;
    expect(isSameOriginReferrer(`${origin}/twitter/post/post-003`, origin)).toBe(true);
    expect(isSameOriginReferrer(`${origin}.evil.com/x`, origin)).toBe(false);
    expect(isSameOriginReferrer(`https://x@evil.com/${origin}`, origin)).toBe(false);
    expect(isSameOriginReferrer("", origin)).toBe(false);
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

  it("外部から入っても、アプリ内で1回遷移していれば戻る", () => {
    setReferrer("https://example.com/foo");
    writeInternalHistoryCount(1);
    Object.defineProperty(window.history, "length", { value: 5, configurable: true });
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<BackButton fallbackHref="/twitter" />);
    fireEvent.click(screen.getByRole("link", { name: "戻る" }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(TWITTER_HISTORY_KEY)).toBe("0");
    back.mockRestore();
  });

  it("偽装 referrer（.evil.com / @evil.com）では戻らない", () => {
    for (const referrer of [
      `${window.location.origin}.evil.com/x`,
      `https://${window.location.host}@evil.com/x`,
    ]) {
      setReferrer(referrer);
      Object.defineProperty(window.history, "length", { value: 5, configurable: true });
      const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
      const { unmount } = render(<BackButton fallbackHref="/twitter" />);
      const link = screen.getByRole("link", { name: "戻る" });
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      link.dispatchEvent(event);
      expect(event.defaultPrevented, referrer).toBe(false);
      expect(back, referrer).not.toHaveBeenCalled();
      back.mockRestore();
      unmount();
    }
  });

  it("直リンク（履歴なし）は fallback への通常リンクのまま", () => {
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
});

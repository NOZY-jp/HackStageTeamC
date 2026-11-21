import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BackButton, isSameOriginReferrer } from "./back-button";
import {
  ensureAppBase,
  goBackInsideApp,
  internalBackRemaining,
  TWITTER_BACK_KEY,
  TWITTER_BASE_KEY,
} from "./history-tracker";

const setLength = (value: number) => {
  Object.defineProperty(window.history, "length", { value, configurable: true });
};
const setReferrer = (value: string) => {
  Object.defineProperty(window.document, "referrer", { value, configurable: true });
};

describe("Twixer の戻る（#249）", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/twitter/search?q=モンハン&f=user");
    setReferrer("");
    setLength(1);
  });

  it("referrer は URL の origin 完全一致で判定する", () => {
    const origin = window.location.origin;
    expect(isSameOriginReferrer(`${origin}/twitter/post/post-003`, origin)).toBe(true);
    expect(isSameOriginReferrer(`${origin}.evil.com/x`, origin)).toBe(false);
    expect(isSameOriginReferrer(`https://x@evil.com/${origin}`, origin)).toBe(false);
    expect(isSameOriginReferrer("", origin)).toBe(false);
  });

  it("アプリ内で戻れるのは積んだ分だけ（連続2回では外部に出ない）", () => {
    setLength(1);
    ensureAppBase();
    setLength(2); // アプリ内で1回遷移した状態
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    expect(goBackInsideApp()).toBe(true);
    expect(goBackInsideApp()).toBe(false);
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(TWITTER_BACK_KEY)).toBe("1");
    back.mockRestore();
  });

  it("基準は最初のマウントでだけ記録し、pathname 変化では増えない", () => {
    setLength(3);
    ensureAppBase();
    const base = window.sessionStorage.getItem(TWITTER_BASE_KEY);
    const used = window.sessionStorage.getItem(TWITTER_BACK_KEY);
    // 何度呼んでも基準は変わらない（pathname 変化で呼ばれても同じ）
    ensureAppBase();
    expect(window.sessionStorage.getItem(TWITTER_BASE_KEY)).toBe(base);
    expect(window.sessionStorage.getItem(TWITTER_BACK_KEY)).toBe(used);
  });

  it("外部から入っても、アプリ内で1回遷移していれば戻る", () => {
    setReferrer("https://example.com/foo");
    setLength(1);
    ensureAppBase();
    setLength(2);
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<BackButton fallbackHref="/twitter" />);
    fireEvent.click(screen.getByRole("link", { name: "戻る" }));
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it("直リンク（履歴が増えていない）は fallback へ", () => {
    setReferrer("");
    setLength(5);
    ensureAppBase();
    expect(internalBackRemaining()).toBe(0);
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

  it("history.length が変わらない環境でも落ちない", () => {
    setLength(1);
    ensureAppBase();
    expect(internalBackRemaining()).toBe(0);
    expect(goBackInsideApp()).toBe(false);
  });
});

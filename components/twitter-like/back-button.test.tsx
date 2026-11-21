import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BackButton } from "./back-button";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const search = "/twitter/search?q=%E5%BC%93&f=user";
const post = "/twitter/post/post-003";

function setHistory(length: number, canGoBack: boolean) {
  Object.defineProperty(window.history, "length", { value: length, configurable: true });
  vi.stubGlobal("navigation", { canGoBack });
}

function clickBack() {
  const link = screen.getByRole("link", { name: "戻る" });
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  // Record whether the component intercepted the link, without navigating jsdom.
  let intercepted = false;
  document.addEventListener(
    "click",
    (click) => {
      intercepted = click.defaultPrevented;
      click.preventDefault();
    },
    { once: true },
  );
  fireEvent(link, event);
  return intercepted;
}

describe("Twixer の戻る（#249）", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    router.replace.mockClear();
    window.history.replaceState(null, "", post);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    [1, () => `${window.location.origin}/twitter`],
    [3, () => `${window.location.origin}.evil.com/`],
    [3, () => `${window.location.origin}@evil.com/`],
    [3, () => ""],
  ])("直前に同一オリジンの履歴がなければリンクに進む（履歴長 %i）", (length, referrer) => {
    Object.defineProperty(window.document, "referrer", { value: referrer(), configurable: true });
    setHistory(length, false);
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<BackButton fallbackHref="/twitter/profile/mai2mai2" />);
    expect(screen.getByRole("link", { name: "戻る" })).toHaveAttribute(
      "href",
      "/twitter/profile/mai2mai2",
    );
    expect(clickBack()).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });

  it("外部流入後も検索に戻れ、クエリを保ち、もう一度押しても外部に戻らない", () => {
    Object.defineProperty(window.document, "referrer", {
      value: "https://example.com/",
      configurable: true,
    });
    setHistory(3, true);
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {
      window.history.replaceState(null, "", search);
      setHistory(3, false);
    });
    render(<BackButton fallbackHref="/twitter" />);
    expect(clickBack()).toBe(true);
    expect(window.location.search).toBe("?q=%E5%BC%93&f=user");
    act(() => vi.advanceTimersByTime(300));
    expect(router.replace).not.toHaveBeenCalled();
    expect(clickBack()).toBe(false);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("戻っても URL が変わらなければ300ms後に fallback へ置き換える", () => {
    setHistory(2, true);
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<BackButton fallbackHref="/twitter" />);
    expect(clickBack()).toBe(true);
    expect(clickBack()).toBe(true);
    expect(back).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(299));
    expect(router.replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(router.replace).toHaveBeenCalledExactlyOnceWith("/twitter");
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BackButton } from "./back-button";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const search = "/twitter/search?q=%E5%BC%93&f=user";
const post = "/twitter/post/post-003";
const origin = window.location.origin;

function setHistory(
  length: number,
  referrer: string,
  previous?: { url: string; sameDocument: boolean },
) {
  Object.defineProperty(window.history, "length", { value: length, configurable: true });
  Object.defineProperty(window.document, "referrer", { value: referrer, configurable: true });
  const traverseTo = vi.fn(() => ({ committed: Promise.resolve(), finished: Promise.resolve() }));
  vi.stubGlobal("navigation", {
    canGoBack: true,
    currentEntry: { index: previous ? 1 : 0 },
    entries: () =>
      previous ? [{ ...previous, key: "previous" }, { key: "current" }] : [{ key: "current" }],
    traverseTo,
  });
  return traverseTo;
}

function clickBack() {
  const link = screen.getByRole("link", { name: "戻る" });
  let intercepted = false;
  document.addEventListener(
    "click",
    (event) => {
      intercepted = event.defaultPrevented;
      event.preventDefault();
    },
    { once: true },
  );
  fireEvent.click(link);
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
    vi.unstubAllGlobals();
  });

  it.each([
    ["新規タブ", 1, origin, origin],
    ["外部流入", 3, "https://example.com/", "https://example.com/"],
    ["偽装ドメイン", 3, `${origin}.evil.com/`, origin],
    ["偽装userinfo", 3, `${origin}@evil.com/`, origin],
    ["referrerなし", 3, "", origin],
  ])(
    "%s では canGoBack が true でも既定のリンクへ進む",
    (_label, length, referrer, previousUrl) => {
      const traverseTo = setHistory(length, referrer, { url: previousUrl, sameDocument: false });
      const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
      try {
        render(<BackButton fallbackHref="/twitter/profile/mai2mai2" />);
        expect(screen.getByRole("link", { name: "戻る" })).toHaveAttribute(
          "href",
          "/twitter/profile/mai2mai2",
        );
        expect(clickBack()).toBe(false);
        expect(traverseTo).not.toHaveBeenCalled();
        expect(back).not.toHaveBeenCalled();
      } finally {
        back.mockRestore();
      }
    },
  );

  it("外部流入後のアプリ内移動からは検索に戻り q と f を維持する", () => {
    const traverseTo = setHistory(3, "https://example.com/", {
      url: origin + search,
      sameDocument: true,
    });
    traverseTo.mockImplementation(() => {
      window.history.replaceState(null, "", search);
      setHistory(3, "https://example.com/");
      return { committed: Promise.resolve(), finished: Promise.resolve() };
    });
    render(<BackButton fallbackHref="/twitter" />);
    expect(clickBack()).toBe(true);
    expect(traverseTo).toHaveBeenCalledExactlyOnceWith("previous");
    expect(window.location.search).toBe("?q=%E5%BC%93&f=user");
    act(() => vi.advanceTimersByTime(300));
    expect(router.replace).not.toHaveBeenCalled();
    expect(clickBack()).toBe(false);
  });

  it("確認済みの履歴に戻れない場合は300ms後に既定の行き先へ置き換える", () => {
    const traverseTo = setHistory(2, origin + search, {
      url: origin + search,
      sameDocument: false,
    });
    render(<BackButton fallbackHref="/twitter" />);
    expect(clickBack()).toBe(true);
    expect(clickBack()).toBe(true);
    expect(traverseTo).toHaveBeenCalledExactlyOnceWith("previous");
    act(() => vi.advanceTimersByTime(299));
    expect(router.replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(router.replace).toHaveBeenCalledExactlyOnceWith("/twitter");
  });

  it("アンマウント時に待機中のタイマーを解除する", () => {
    setHistory(2, origin + search, { url: origin + search, sameDocument: false });
    const { unmount } = render(<BackButton fallbackHref="/twitter" />);
    expect(clickBack()).toBe(true);
    unmount();
    act(() => vi.advanceTimersByTime(300));
    expect(router.replace).not.toHaveBeenCalled();
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BackButton } from "./back-button";
import { trackDocumentHistory } from "./document-history";

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

  it("Navigation APIなしでも同じ文書内のpushから戻り、外部へは抜けない", async () => {
    vi.useRealTimers();
    vi.stubGlobal("navigation", undefined);
    Object.defineProperty(document, "referrer", {
      value: "https://example.com/",
      configurable: true,
    });
    Reflect.deleteProperty(history, "length");
    const stopTracking = trackDocumentHistory();
    const back = vi.spyOn(history, "back");
    try {
      render(<BackButton fallbackHref="/twitter" />);
      expect(clickBack()).toBe(false);
      history.pushState({ custom: 1 }, "", search);
      history.replaceState({ custom: 2 }, "", `${search}&more=1`);
      expect(history.state.custom).toBe(2);
      const returned = new Promise<void>((resolve) => {
        window.addEventListener("popstate", () => resolve(), { once: true });
      });
      expect(clickBack()).toBe(true);
      expect(back).toHaveBeenCalledOnce();
      await returned;
      expect(window.location.pathname).toBe(post);
      expect(clickBack()).toBe(false);
      expect(back).toHaveBeenCalledOnce();
    } finally {
      back.mockRestore();
      stopTracking();
    }
  });

  it("同じ検索ルートで戻りが完了したら300msを待たず次の履歴へ戻る", () => {
    const first = "/twitter/search?q=mai&f=user";
    const second = "/twitter/search?q=kanon&f=user";
    window.history.replaceState(null, "", second);
    const traverseTo = setHistory(3, "", { url: origin + first, sameDocument: true });
    traverseTo.mockImplementationOnce(() => {
      window.history.replaceState(null, "", first);
      window.dispatchEvent(new PopStateEvent("popstate"));
      return { committed: Promise.resolve(), finished: Promise.resolve() };
    });
    render(<BackButton fallbackHref="/twitter" />);
    expect(clickBack()).toBe(true);
    expect(location.pathname).toBe("/twitter/search");
    expect(location.search).toBe("?q=mai&f=user");
    expect(clickBack()).toBe(true);
    expect(traverseTo).toHaveBeenCalledTimes(2);
  });
});

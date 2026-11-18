import { describe, expect, it } from "vitest";
import { compensatedScrollTop, isAtBottom } from "./paging-scroll";

describe("段階的読み込みのスクロール計算", () => {
  it("先頭に増えた高さの分だけ scrollTop を足す", () => {
    expect(
      compensatedScrollTop({
        prevScrollTop: 0,
        prevScrollHeight: 3400,
        nextScrollHeight: 6800,
        clientHeight: 800,
      }),
    ).toBe(3400);

    expect(
      compensatedScrollTop({
        prevScrollTop: 1200,
        prevScrollHeight: 5000,
        nextScrollHeight: 8400,
        clientHeight: 800,
      }),
    ).toBe(4600);
  });

  it("増減が無ければそのまま", () => {
    expect(
      compensatedScrollTop({
        prevScrollTop: 500,
        prevScrollHeight: 3000,
        nextScrollHeight: 3000,
        clientHeight: 800,
      }),
    ).toBe(500);
  });

  it("最大スクロール量を超えない・負にならない", () => {
    expect(
      compensatedScrollTop({
        prevScrollTop: 100,
        prevScrollHeight: 3000,
        nextScrollHeight: 3100,
        clientHeight: 1000,
      }),
    ).toBe(200);
    expect(
      compensatedScrollTop({
        prevScrollTop: 0,
        prevScrollHeight: 3000,
        nextScrollHeight: 2000,
        clientHeight: 1000,
      }),
    ).toBe(0);
  });

  it("最下部判定は 8px 以内を許容する", () => {
    expect(isAtBottom({ scrollTop: 200, scrollHeight: 1000, clientHeight: 800 })).toBe(true);
    expect(isAtBottom({ scrollTop: 192, scrollHeight: 1000, clientHeight: 800 })).toBe(true);
    expect(isAtBottom({ scrollTop: 180, scrollHeight: 1000, clientHeight: 800 })).toBe(false);
  });
});

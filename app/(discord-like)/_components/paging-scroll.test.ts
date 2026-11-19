import { describe, expect, it } from "vitest";
import { isAtBottom } from "./paging-scroll";

describe("段階的読み込みのスクロール計算", () => {
  it("最下部判定は 8px 以内を許容する", () => {
    expect(isAtBottom({ scrollTop: 200, scrollHeight: 1000, clientHeight: 800 })).toBe(true);
    expect(isAtBottom({ scrollTop: 192, scrollHeight: 1000, clientHeight: 800 })).toBe(true);
    expect(isAtBottom({ scrollTop: 180, scrollHeight: 1000, clientHeight: 800 })).toBe(false);
  });
});

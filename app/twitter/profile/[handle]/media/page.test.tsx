import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TwitterProfileMediaPage from "./page";

describe("メディアタブ（#94）", () => {
  it("画像つきのポストだけを並べる", async () => {
    const ui = await TwitterProfileMediaPage({
      params: Promise.resolve({ handle: "kanon__dayo" }),
    });
    const { container } = render(ui);

    // 画像つきの投稿（post-103 / post-104）が出る
    expect(container.textContent).toContain("高校のときの。");
    expect(container.textContent).toContain("アルバムを整理してたら出てきた。");
    // 画像も出る（2件で3枚）
    expect(container.querySelectorAll("img").length).toBeGreaterThanOrEqual(3);
    // 画像なしの投稿（リプライ）は出ない
    expect(container.textContent).not.toContain("ブログにも書いて");
  });

  it("画像つきの投稿が無い人では空表示", async () => {
    const ui = await TwitterProfileMediaPage({ params: Promise.resolve({ handle: "ren" }) });
    const { container } = render(ui);
    expect(container.textContent).toContain("メディアはまだありません");
  });
});

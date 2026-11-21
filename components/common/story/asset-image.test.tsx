import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BackgroundImage } from "./stage/asset-image";

/**
 * #226: 第5章の写真（洋菓子店・マンホール）は画面を覆わず、
 * 縦横比を保ったまま中央に収める。他の背景は従来どおり cover。
 */

describe("背景画像の収め方（#226）", () => {
  it("洋菓子店とマンハール街は contain で中央に収める", () => {
    for (const id of ["sweets-shop", "manhole-street"] as const) {
      const { container, unmount } = render(<BackgroundImage background={id} />);
      const wrapper = container.querySelector(".sp-photo");
      expect(wrapper, id).not.toBeNull();
      const image = wrapper?.querySelector("img");
      expect(image, id).not.toBeNull();
      expect(image?.className, id).toContain("sp-photo-image");
      expect(container.querySelector(".sp-cover"), id).toBeNull();
      unmount();
    }
  });

  it("ふつうの背景は cover のまま", () => {
    const { container } = render(<BackgroundImage background="station" />);
    expect(container.querySelector("img")?.className).toContain("sp-cover");
    expect(container.querySelector(".sp-photo")).toBeNull();
  });
});

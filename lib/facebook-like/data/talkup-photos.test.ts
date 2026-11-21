import { describe, expect, it } from "vitest";
import type { FbPost } from "../types";
import { fbPosts } from "./posts";

/**
 * #228: TalkUp の仮写真の整理。人物の照合に使う写真だけを残し、
 * 使い回していた海の写真は外す。本名・住所・結末は画像の alt にも書かない。
 */

const u40: FbPost[] = fbPosts.filter((post) => post.authorId === "u40");

describe("TalkUp の写真（#228）", () => {
  it("人物の照合に使う写真は、入学式と高校の友達の2枚だけ", () => {
    const matching = u40.filter(
      (post) =>
        post.attachment?.kind === "photo" && (post.attachment.alt ?? "").includes("黒髪のボブ"),
    );
    expect(matching.map((post) => post.id)).toEqual(["fbp-201", "fbp-203"]);
    const sea = u40.find((post) => post.id === "fbp-202");
    expect(sea?.attachment?.kind).toBe("photo");
    expect(sea?.attachment?.kind === "photo" ? sea.attachment.alt : "").not.toContain("黒髪");
  });

  it("照合用写真のaltは二人の見た目を説明し、本名・住所・学校名を書かない", () => {
    for (const post of u40) {
      const alt = post.attachment?.kind === "photo" ? post.attachment.alt : "";
      for (const word of ["服部", "由比", "神奈川県の高校", "住所", "でんちゃん"]) {
        expect(alt, post.id).not.toContain(word);
      }
    }
  });

  it("画像は入学式とカフェで別の素材を使う（同じ画像の使い回しをしない）", () => {
    const sources = u40
      .map((post) => (post.attachment?.kind === "photo" ? post.attachment.src : undefined))
      .filter((src): src is string => Boolean(src));
    expect(new Set(sources).size).toBe(sources.length);
  });
});

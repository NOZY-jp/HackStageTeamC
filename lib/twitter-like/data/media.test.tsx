import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PostMediaList } from "@/components/twitter-like/post-card";
import { twitterPosts } from "./twitter";

it("卒業式の写真を正しい左右と寸法で遅延表示する", () => {
  const media = twitterPosts.find((post) => post.id === "post-103")?.media ?? [];
  render(<PostMediaList media={media} />);
  const [graduation, cafe] = screen.getAllByRole("img");

  expect(graduation).toHaveAttribute("src", "/blog-like/photos/graduation.webp");
  expect(graduation).toHaveAccessibleName(/左は橙髪.*右は黒髪のボブ/);
  expect(graduation).toHaveAttribute("width", "1200");
  expect(graduation).toHaveAttribute("height", "800");
  expect(graduation).toHaveAttribute("loading", "lazy");
  expect(cafe).toHaveAttribute("src", "/twitter-like/photo-02.svg");

  for (const image of media) {
    expect(existsSync(join(process.cwd(), "public", image.src))).toBe(true);
  }
});

import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getPost, getUser } from "@/lib/twitter-like";
import { Avatar } from "./avatar";

const FORBIDDEN = ["服部", "由比", "神奈川", "学校", "高校", "住所", "ゆい", "ハル"];

const kanon = () => {
  const user = getUser("tw-kanon");
  if (!user) throw new Error("かのんのアカウントがない");
  return user;
};

describe("Twixerのアイコンと照合（#169）", () => {
  it("かのんのアイコンは実在する画像で、名前・学校名・地名を書かない", () => {
    const user = kanon();
    expect(user.avatarSrc).toBe("/twitter-like/kanon-avatar.svg");
    expect(user.avatarAlt).toBeTruthy();
    expect(existsSync(join(process.cwd(), "public", user.avatarSrc ?? ""))).toBe(true);
    for (const word of FORBIDDEN) {
      expect(user.avatarAlt).not.toContain(word);
    }
  });

  it("自画像とアルバムの特徴を維持し、写真の alt を匿名にする", () => {
    const user = kanon();
    expect(user.avatarAlt).toContain("茶髪");
    expect(user.avatarAlt).toContain("ロング");
    expect(getPost("post-104")?.media?.[0]?.alt).toContain("茶髪のロングが本人");
    for (const postId of ["post-103", "post-104"]) {
      const alt = getPost(postId)?.media?.[0]?.alt ?? "";
      expect(alt, postId).toBeTruthy();
      for (const word of FORBIDDEN) expect(alt, postId).not.toContain(word);
    }
  });

  it("プロフィールでは画像のアバターを alt 付きで出す", () => {
    const user = kanon();
    render(<Avatar user={user} size="xl" />);
    const image = screen.getByRole("img", { name: user.avatarAlt });
    expect(image).toHaveAttribute("src", "/twitter-like/kanon-avatar.svg");
  });

  it("画像のアバターでも、読み上げ用の alt は空にしない", () => {
    const user = kanon();
    render(<Avatar user={user} />);
    expect(screen.getByRole("img")).toHaveAccessibleName();
  });
});

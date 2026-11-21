import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HAL_HANDLE } from "@/lib/discord-like/data/names";
import { getUserByHandle } from "@/lib/twitter-like";
import { TwitterNav } from "./nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/twitter",
}));

describe("TwitterNav", () => {
  it("Left nav profile link points at a real user", () => {
    render(<TwitterNav />);
    const href = `/twitter/profile/${HAL_HANDLE}`;
    const profileLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === href);
    expect(profileLinks.length).toBeGreaterThan(0);
    expect(getUserByHandle(HAL_HANDLE)).toBeDefined();
  });
});

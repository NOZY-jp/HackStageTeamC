import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getUserByHandle, listFriends } from "@/lib/facebook-like";
import { FacebookProvider } from "./facebook-context";
import { ProfileView } from "./profile-view";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/talkup/profile/yui__photo",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

describe("ProfileView（u40）", () => {
  it("フィードから外した u40 の投稿もプロフィールでは表示する", () => {
    const user = getUserByHandle("yui__photo");
    expect(user).toBeDefined();
    if (!user) return;

    render(
      <FacebookProvider>
        <ProfileView user={user} friends={listFriends(user.id)} />
      </FacebookProvider>,
    );

    expect(screen.getByRole("button", { name: "投稿 (23)" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("服部 由比の投稿").length).toBeGreaterThan(0);
  });
});

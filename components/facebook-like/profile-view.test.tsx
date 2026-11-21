import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getUserByHandle, listFollowers, listFollowing, listFriends } from "@/lib/facebook-like";
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

    expect(screen.getByText("投稿 (23)")).toBeInTheDocument();
    const expectedLabel = `${user.displayName}の投稿`;
    expect(screen.getAllByLabelText(expectedLabel)).toHaveLength(23);
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(23);
    for (const article of articles) {
      expect(article).toHaveAttribute("aria-label", expectedLabel);
    }
  });

  it("u40 のフォロワー一覧で、写真部5人には相互フォローを表示し χ（imperial_chi）だけ出さない", () => {
    const user = getUserByHandle("yui__photo");
    expect(user).toBeDefined();
    if (!user) return;

    render(
      <FacebookProvider>
        <ProfileView
          user={user}
          friends={listFriends(user.id)}
          following={listFollowing(user.id)}
          followers={listFollowers(user.id)}
        />
      </FacebookProvider>,
    );

    expect(screen.getByRole("tab", { name: "フォロー中 (5)" })).toBeInTheDocument();
    const followersTab = screen.getByRole("tab", { name: "フォロワー (6)" });
    fireEvent.click(followersTab);
    expect(followersTab).toHaveAttribute("aria-selected", "true");

    const mutualBadges = screen.getAllByText("相互フォロー");
    expect(mutualBadges).toHaveLength(5);

    const kaiLink = screen.getByRole("link", { name: /@imperial_chi/ });
    expect(kaiLink).toHaveAttribute("href", "/talkup/profile/imperial_chi");
    expect(kaiLink).not.toHaveTextContent("相互フォロー");
  });
});

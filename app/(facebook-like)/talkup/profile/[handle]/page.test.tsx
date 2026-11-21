import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import { StoryTrigger } from "@/components/common/story/story-trigger";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import { ProfileView } from "@/components/facebook-like/profile-view";
import { getUserByHandle, listFollowers, listFollowing, listFriends } from "@/lib/facebook-like";
import { KAI_TALKUP_HANDLE, KAI_TALKUP_USER_ID } from "@/lib/facebook-like/data/users";
import type { FlagId } from "@/lib/story";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/talkup/profile/imperial_chi",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

function FlagProbe({ onFlags }: { onFlags: (flags: FlagId[]) => void }) {
  const { state, ready } = useStory();
  if (ready) onFlags(state.flags);
  return null;
}

describe("TalkUp プロフィールページの StoryTrigger（imperial_chi）", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("@imperial_chi を開くと te03-talkup-kai-follower が立つ", async () => {
    const user = getUserByHandle(KAI_TALKUP_HANDLE);
    expect(user?.id).toBe(KAI_TALKUP_USER_ID);
    if (!user) return;

    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        <FacebookProvider>
          {user.id === KAI_TALKUP_USER_ID ? <StoryTrigger flag="te03-talkup-kai-follower" /> : null}
          <ProfileView
            user={user}
            friends={listFriends(user.id)}
            following={listFollowing(user.id)}
            followers={listFollowers(user.id)}
          />
        </FacebookProvider>
        <FlagProbe onFlags={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    await waitFor(() => expect(seen.at(-1)).toContain("te03-talkup-kai-follower"));
  });
});

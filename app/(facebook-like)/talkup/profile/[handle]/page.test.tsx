import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import { KAI_TALKUP_HANDLE } from "@/lib/facebook-like/data/users";
import type { FlagId } from "@/lib/story";
import { ProfileContent } from "./profile-content";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/talkup/profile/imperial_chi",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
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
    const ui = await ProfileContent({ params: Promise.resolve({ handle: KAI_TALKUP_HANDLE }) });
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        <FacebookProvider>{ui}</FacebookProvider>
        <FlagProbe onFlags={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    await waitFor(() => expect(seen.at(-1)).toContain("te03-talkup-kai-follower"));
  });

  it("他の通常アカウント（@member04）では te03-talkup-kai-follower が立たない", async () => {
    const ui = await ProfileContent({ params: Promise.resolve({ handle: "member04" }) });
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        <FacebookProvider>{ui}</FacebookProvider>
        <FlagProbe onFlags={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen.at(-1)).not.toContain("te03-talkup-kai-follower");
  });
});

import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import { KAI_TALKUP_HANDLE } from "@/lib/facebook-like/data/users";
import { type FlagId, STORAGE_KEY } from "@/lib/story";
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

/** 進行状態を localStorage に置いてから描画する（順序7〜9のフラグだけを指定できる） */
const seed = (flags: string[]) =>
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ flags, completed: ["ch5-kai-contact"], choices: {} }),
  );

/** 段階10の対象（u40・本名で探す本人）のハンドル */
const SPOILER_HANDLE = "yui__photo";

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

describe("TalkUp プロフィールページの段階10（#275）", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const renderProfile = async () => {
    const ui = await ProfileContent({ params: Promise.resolve({ handle: SPOILER_HANDLE }) });
    const seen: FlagId[][] = [];
    render(
      <StoryProvider>
        <FacebookProvider>{ui}</FacebookProvider>
        <FlagProbe onFlags={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );
    return seen;
  };

  it("段階8（本名）直後に u40 を直接開いても s10-talkup-match は立たない", async () => {
    seed(["s07-contest-entry", "s08-real-name"]);
    const seen = await renderProfile();

    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    // トリガーの遅延（2,500ms）を過ぎても立たない
    await new Promise((resolve) => setTimeout(resolve, 2800));
    expect(seen.at(-1)).not.toContain("s10-talkup-match");
  });

  it("段階9（カイの連絡）の後に u40 を開くと s10-talkup-match が立つ", async () => {
    seed(["s07-contest-entry", "s08-real-name", "s09-kai-contact"]);
    const seen = await renderProfile();

    await waitFor(() => expect(seen.at(-1)).toContain("s10-talkup-match"), { timeout: 6000 });
  });
});

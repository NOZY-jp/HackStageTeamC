import { act, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import { HAL_HANDLE } from "@/lib/discord-like/data/names";
import type { FlagId } from "@/lib/story";
import TwitterProfilePage from "./page";

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
const observers: { callback: ObserverCallback }[] = [];

class MockIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observers.push({ callback });
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

function FlagProbe({ onFlags }: { onFlags: (flags: FlagId[]) => void }) {
  const { state, ready } = useStory();
  if (ready) onFlags(state.flags);
  return null;
}

describe("TwitterProfilePage", () => {
  beforeEach(() => {
    observers.length = 0;
    window.localStorage.clear();
  });

  it.each([
    { handle: HAL_HANDLE, action: "プロフィールを編集" },
    { handle: "kanon__dayo", action: "フォロー" },
    { handle: "mai2mai2", action: "フォロー中" },
    { handle: "kaiser018023071", action: "フォロー中" },
  ])("@$handle に $action ボタンを無効状態で表示する", async ({ handle, action }) => {
    render(await TwitterProfilePage({ params: Promise.resolve({ handle }) }));
    const profile = within(screen.getByRole("region", { name: "プロフィール" }));
    expect(profile.getByRole("button", { name: action })).toBeDisabled();
  });

  it("@kanon__dayo では開いた時点で foundBff のみ立ち、post-105 が見えた時点で te04-kanon-stalker-post が立つ", async () => {
    const seen: FlagId[][] = [];
    const ui = await TwitterProfilePage({ params: Promise.resolve({ handle: "kanon__dayo" }) });
    render(
      <StoryProvider>
        {ui}
        <FlagProbe onFlags={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    await waitFor(() => expect(seen.at(-1)).toContain("foundBff"));
    expect(seen.at(-1)).not.toContain("te04-kanon-stalker-post");
    expect(observers).toHaveLength(1);

    await act(async () =>
      observers[0].callback([{ isIntersecting: true, intersectionRatio: 0.5 }]),
    );
    await waitFor(() => expect(seen.at(-1)).toContain("te04-kanon-stalker-post"));
  });
});

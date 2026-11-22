import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import type { FlagId } from "@/lib/story";
import { KANON_STALKER_POST_ID } from "@/lib/twitter-like/data/twitter";
import TwitterPostPage from "./page";

function FlagProbe({ onFlags }: { onFlags: (flags: FlagId[]) => void }) {
  const { state, ready } = useStory();
  if (ready) onFlags(state.flags);
  return null;
}

describe("TwitterPostPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("親の post-101 を開いただけでは s02-bff-reply が立たない", async () => {
    const seen: FlagId[][] = [];
    const ui = await TwitterPostPage({ params: Promise.resolve({ postId: "post-101" }) });
    render(
      <StoryProvider>
        {ui}
        <FlagProbe onFlags={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen.at(-1)).not.toContain("s02-bff-reply");
  });

  it("返信の post-102 を開くと s02-bff-reply が立つ", async () => {
    const seen: FlagId[][] = [];
    const ui = await TwitterPostPage({ params: Promise.resolve({ postId: "post-102" }) });
    render(
      <StoryProvider>
        {ui}
        <FlagProbe onFlags={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    await waitFor(() => expect(seen.at(-1)).toContain("s02-bff-reply"));
  });

  it("post-105 の個別ページを開くと te04-kanon-stalker-post が立つ", async () => {
    const seen: FlagId[][] = [];
    const ui = await TwitterPostPage({
      params: Promise.resolve({ postId: KANON_STALKER_POST_ID }),
    });
    render(
      <StoryProvider>
        {ui}
        <FlagProbe onFlags={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    await waitFor(() => expect(seen.at(-1)).toContain("te04-kanon-stalker-post"));
  });

  it("他の通常ポスト（post-106）では te04-kanon-stalker-post が立たない", async () => {
    const seen: FlagId[][] = [];
    const ui = await TwitterPostPage({ params: Promise.resolve({ postId: "post-106" }) });
    render(
      <StoryProvider>
        {ui}
        <FlagProbe onFlags={(flags) => seen.push(flags)} />
      </StoryProvider>,
    );

    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen.at(-1)).not.toContain("te04-kanon-stalker-post");
  });
});
